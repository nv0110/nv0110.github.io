import { useTransition } from 'react';
import { useNavigate } from 'react-router-dom';

export function useViewTransition() {
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  const viewTransitionNavigate = (to, options = {}) => {
    startTransition(() => {
      navigate(to, options);
    });
  };

  return {
    navigate: viewTransitionNavigate,
    isPending
  };
} 
