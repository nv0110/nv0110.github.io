import { unstable_ViewTransition as ViewTransition } from 'react';

function ViewTransitionWrapper({ children, enabled = true }) {
  // Check if ViewTransition is available (it's experimental)
  if (!enabled || typeof ViewTransition === 'undefined') {
    return children;
  }

  return (
    <ViewTransition>
      {children}
    </ViewTransition>
  );
}

export default ViewTransitionWrapper; 