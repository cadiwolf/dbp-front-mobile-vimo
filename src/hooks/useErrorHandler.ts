import { useState } from 'react';
import { getErrorInfo, ValidationErrors } from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  errorInfo: {
    message: string;
    validationErrors?: ValidationErrors;
    shouldShowAlert?: boolean;
  } | null;
  showError: boolean;
  handleError: (error: any, context?: string) => void;
  clearError: () => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    validationErrors?: ValidationErrors;
    shouldShowAlert?: boolean;
  } | null>(null);
  
  const handleError = (error: any, context?: string) => {
    console.error(`Error in ${context || 'operation'}:`, error);
    
    if (error.processedError) {
      setErrorInfo(error.processedError);
    } else {
      const processedError = getErrorInfo(error, context);
      setErrorInfo(processedError);
    }
  };

  const clearError = () => {
    setErrorInfo(null);
  };

  return {
    errorInfo,
    showError: !!errorInfo,
    handleError,
    clearError,
  };
};
