
import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const QuitConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="bg-[var(--bg-card)] border border-[var(--border)] max-w-md rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}>
            Quit Game?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--text-muted)] text-base">
            Your progress will be lost. Are you sure you want to end the current game and return to the home screen?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-3">
          <AlertDialogCancel 
            onClick={onConfirm} 
            className="w-full sm:w-auto h-12 bg-transparent border border-[var(--border-mid)] text-[var(--text)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)] font-medium rounded-lg"
          >
            Quit to Home
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onCancel} 
            className="w-full sm:w-auto h-12 bg-[var(--red)] text-white hover:bg-[var(--red-hover)] font-semibold rounded-lg"
          >
            Continue Playing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default QuitConfirmationModal;
