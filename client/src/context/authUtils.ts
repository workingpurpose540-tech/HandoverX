export function formatAuthError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please verify your credentials and try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact your workspace administrator.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Unable to reach the authentication service. Please check your network connection and try again.';
      case 'auth/requires-recent-login':
        return 'This action requires recent authentication. Please sign in again.';
      default:
        if (
          'message' in error &&
          typeof (error as { message: string }).message === 'string'
        ) {
          const rawMessage = (error as { message: string }).message;
          if (
            rawMessage.toLowerCase().includes('failed to fetch') ||
            rawMessage.toLowerCase().includes('networkerror') ||
            rawMessage.toLowerCase().includes('network-request-failed')
          ) {
            return 'Unable to reach the authentication service. Please check your network connection and try again.';
          }
          return rawMessage;
        }
    }
  }
  if (error instanceof Error) {
    const rawMessage = error.message;
    if (
      rawMessage.toLowerCase().includes('failed to fetch') ||
      rawMessage.toLowerCase().includes('networkerror') ||
      rawMessage.toLowerCase().includes('network-request-failed')
    ) {
      return 'Unable to reach the authentication service. Please check your network connection and try again.';
    }
    return rawMessage;
  }
  return 'An unexpected authentication error occurred. Please try again.';
}

