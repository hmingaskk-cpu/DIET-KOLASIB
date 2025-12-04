"use client";

import { useEffect, useCallback } from 'react';
import { useForm, Control, FieldValues } from 'react-hook-form';
import { debounce } from '@/lib/utils'; // Import the debounce utility

interface UseAutoSaveFormOptions<TFieldValues extends FieldValues> {
  formName: string;
  control: Control<TFieldValues>;
  defaultValues: TFieldValues;
  onRestore?: (data: TFieldValues) => void;
}

export const useAutoSaveForm = <TFieldValues extends FieldValues>({
  formName,
  control,
  defaultValues,
  onRestore,
}: UseAutoSaveFormOptions<TFieldValues>) => {
  const { watch, reset } = useForm<TFieldValues>({ control });

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`autoSave_${formName}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as TFieldValues;
        // Merge with default values to ensure all fields are present
        const restoredData = { ...defaultValues, ...parsedData };
        reset(restoredData);
        onRestore?.(restoredData);
        console.log(`Auto-saved data restored for ${formName}.`);
      } catch (e) {
        console.error(`Failed to parse auto-saved data for ${formName}:`, e);
        localStorage.removeItem(`autoSave_${formName}`); // Clear corrupted data
      }
    }
  }, [formName, reset, defaultValues, onRestore]);

  // Save form data on changes with debounce
  const saveFormState = useCallback(debounce((data: TFieldValues) => {
    localStorage.setItem(`autoSave_${formName}`, JSON.stringify(data));
    console.log(`Auto-saved form data for ${formName}.`);
  }, 1000), [formName]); // Debounce for 1 second

  useEffect(() => {
    const subscription = watch((value) => {
      saveFormState(value as TFieldValues);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveFormState]);

  // Function to clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`autoSave_${formName}`);
    console.log(`Auto-saved data cleared for ${formName}.`);
  }, [formName]);

  return { clearSavedData };
};