import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AlertSettings {
  timelineBehindPct: number;
  deadlineDaysCritical: number;
  ownerMaxActive: number;
  budgetOverrunWarnPct: number;
  budgetOverrunCritPct: number;
  lowRoiPct: number;
  digest: {
    enabled: boolean;
    channel: 'email' | 'slack' | 'none';
    timeUTC: string;
  };
}

interface BriefSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeUTC: string;
  channel: 'email' | 'slack' | 'none';
}

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlertSettings | null;
  onSave: (settings: AlertSettings) => Promise<void>;
  saving: boolean;
  error: string | null;
}

const ALERT_TOOLTIPS = {
  timelineBehindPct: 'Alert when initiatives fall behind schedule by this percentage',
  deadlineDaysCritical: 'Show critical alerts this many days before deadline',
  ownerMaxActive: 'Alert when a team member has more than this many active initiatives',
  budgetOverrunWarnPct: 'Warning threshold for budget overruns (percentage)',
  budgetOverrunCritPct: 'Critical threshold for budget overruns (percentage)',
  lowRoiPct: 'Alert when ROI falls below this percentage',
};

const VALIDATION_RULES = {
  timelineBehindPct: { min: 5, max: 100, step: 5 },
  deadlineDaysCritical: { min: 1, max: 90, step: 1 },
  ownerMaxActive: { min: 1, max: 20, step: 1 },
  budgetOverrunWarnPct: { min: 5, max: 100, step: 5 },
  budgetOverrunCritPct: { min: 10, max: 200, step: 5 },
  lowRoiPct: { min: 0, max: 50, step: 1 },
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AlertSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  saving,
  error,
}: AlertSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AlertSettings | null>(null);
  const [briefSchedule, setBriefSchedule] = useState<BriefSchedule | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings({ ...settings });
      loadBriefSchedule();
    }
  }, [settings]);

  useEffect(() => {
    if (localSettings && settings) {
      const hasChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
      setHasChanges(hasChanged);
    }
  }, [localSettings, settings]);

  const loadBriefSchedule = async () => {
    try {
      const response = await fetch('/api/executive/brief/schedule');
      if (response.ok) {
        const data = await response.json();
        setBriefSchedule(data.schedule);
      }
    } catch (error) {
      console.warn('Failed to load brief schedule:', error);
    }
  };

  const validateField = (field: keyof typeof VALIDATION_RULES, value: number): string | null => {
    const rules = VALIDATION_RULES[field];
    if (value < rules.min) return `Minimum value is ${rules.min}`;
    if (value > rules.max) return `Maximum value is ${rules.max}`;
    return null;
  };

  const validateAllFields = (settings: AlertSettings): Record<string, string> => {
    const errors: Record<string, string> = {};

    Object.keys(VALIDATION_RULES).forEach((field) => {
      const key = field as keyof typeof VALIDATION_RULES;
      const value = settings[key] as number;
      const error = validateField(key, value);
      if (error) errors[field] = error;
    });

    // Cross-field validation
    if (settings.budgetOverrunWarnPct >= settings.budgetOverrunCritPct) {
      errors.budgetOverrunCritPct = 'Critical threshold must be higher than warning threshold';
    }

    return errors;
  };

  const handleFieldChange = (field: keyof AlertSettings, value: any) => {
    if (!localSettings) return;

    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);

    // Validate only this field
    if (field in VALIDATION_RULES) {
      const error = validateField(field as keyof typeof VALIDATION_RULES, value);
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error || '',
      }));
    }
  };

  const handleSave = async () => {
    if (!localSettings) return;

    const errors = validateAllFields(localSettings);
    setValidationErrors(errors);

    if (Object.keys(errors).some((key) => errors[key])) {
      return;
    }

    try {
      await onSave(localSettings);

      // Save brief schedule if changed
      if (briefSchedule) {
        await fetch('/api/executive/brief/schedule', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedule: briefSchedule }),
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setHasChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleBriefScheduleChange = (field: keyof BriefSchedule, value: any) => {
    if (!briefSchedule) return;
    setBriefSchedule({ ...briefSchedule, [field]: value });
  };

  if (!localSettings) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Alert & Brief Settings
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-8">
              {/* Success Message */}
              {saveSuccess && (
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-green-800">Settings saved successfully!</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3" />
                  <span className="text-red-800">{error}</span>
                </div>
              )}

              {/* Alert Thresholds */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(VALIDATION_RULES).map(([field, rules]) => {
                    const value = localSettings[field as keyof AlertSettings] as number;
                    const error = validationErrors[field];
                    const tooltip = ALERT_TOOLTIPS[field as keyof typeof ALERT_TOOLTIPS];

                    return (
                      <div key={field} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {field
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase())}
                          </label>
                          <div className="group relative">
                            <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              {tooltip}
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            min={rules.min}
                            max={rules.max}
                            step={rules.step}
                            value={value}
                            onChange={(e) =>
                              handleFieldChange(
                                field as keyof AlertSettings,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          <div className="absolute right-3 top-2 text-sm text-gray-500">
                            {field.includes('Pct') ? '%' : field.includes('Days') ? 'days' : ''}
                          </div>
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="text-xs text-gray-500">
                          Range: {rules.min}-{rules.max}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Digest Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Digest</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localSettings.digest.enabled}
                      onChange={(e) =>
                        handleFieldChange('digest', {
                          ...localSettings.digest,
                          enabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Enable daily digest notifications
                    </label>
                  </div>

                  {localSettings.digest.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Channel
                        </label>
                        <select
                          value={localSettings.digest.channel}
                          onChange={(e) =>
                            handleFieldChange('digest', {
                              ...localSettings.digest,
                              channel: e.target.value as 'email' | 'slack' | 'none',
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="email">Email</option>
                          <option value="slack">Slack</option>
                          <option value="none">None (Dashboard only)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time (UTC)
                        </label>
                        <input
                          type="time"
                          value={localSettings.digest.timeUTC}
                          onChange={(e) =>
                            handleFieldChange('digest', {
                              ...localSettings.digest,
                              timeUTC: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Executive Brief Schedule */}
              {briefSchedule && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Executive Brief Schedule
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={briefSchedule.enabled}
                        onChange={(e) => handleBriefScheduleChange('enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Enable automatic executive brief generation
                      </label>
                    </div>

                    {briefSchedule.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frequency
                          </label>
                          <select
                            value={briefSchedule.frequency}
                            onChange={(e) => handleBriefScheduleChange('frequency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        {briefSchedule.frequency === 'weekly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Day of Week
                            </label>
                            <select
                              value={briefSchedule.dayOfWeek ?? 1}
                              onChange={(e) =>
                                handleBriefScheduleChange('dayOfWeek', parseInt(e.target.value))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {DAY_NAMES.map((day, index) => (
                                <option key={index} value={index}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {briefSchedule.frequency === 'monthly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Day of Month
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={briefSchedule.dayOfMonth ?? 1}
                              onChange={(e) =>
                                handleBriefScheduleChange(
                                  'dayOfMonth',
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time (UTC)
                          </label>
                          <input
                            type="time"
                            value={briefSchedule.timeUTC}
                            onChange={(e) => handleBriefScheduleChange('timeUTC', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Delivery Channel
                          </label>
                          <select
                            value={briefSchedule.channel}
                            onChange={(e) => handleBriefScheduleChange('channel', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="email">Email</option>
                            <option value="slack">Slack</option>
                            <option value="none">Dashboard Only</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-500">{hasChanges && '• Unsaved changes'}</div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  saving || Object.keys(validationErrors).some((key) => validationErrors[key])
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
