export const DEFAULT_TIME_ZONE = 'America/Chicago';

export const formattedMsAgo = (msAgo: number): string => {
  if (msAgo < 60 * 1000) {
    return 'Just now';
  } else if (msAgo < 60 * 60 * 1000) {
    const mins = Math.floor(msAgo / (60 * 1000));
    if (mins > 1) {
      return `${mins} minutes ago`;
    }
    return `${mins} minute ago`;
  } else if (msAgo < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(msAgo / (60 * 60 * 1000));
    if (hours > 1) {
      return `${hours} hours ago`;
    }
    return `${hours} hour ago`;
  } else if (msAgo < 30 * 24 * 60 * 60 * 1000) {
    // 30 days
    const days = Math.floor(msAgo / (24 * 60 * 60 * 1000));
    if (days > 1) {
      return `${days} days ago`;
    }
    return `${days} day ago`;
  } else if (msAgo < 365 * 24 * 60 * 60 * 1000) {
    // 365 days
    const months = Math.floor(msAgo / (30 * 24 * 60 * 60 * 1000));
    if (months > 1) {
      return `${months} months ago`;
    }
    return `${months} month ago`;
  } else {
    const years = Math.floor(msAgo / (365 * 24 * 60 * 60 * 1000));
    if (years > 1) {
      return `${years} years ago`;
    }
    return `${years} year ago`;
  }
};
