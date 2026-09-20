const USER_KEY = 'cyberforge_user';

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

export const onboardingService = {
  async saveOnboarding(data) {
    await delay();
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) throw new Error('Not authenticated.');
    const user = JSON.parse(raw);
    const updated = {
      ...user,
      onboardingCompleted: true,
      onboarding: data,
      userType: data.userType || null,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },

  getOnboarding() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      return user.onboarding || null;
    } catch {
      return null;
    }
  },

  isOnboardingCompleted() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return false;
    try {
      const user = JSON.parse(raw);
      return user.onboardingCompleted === true;
    } catch {
      return false;
    }
  },
};
