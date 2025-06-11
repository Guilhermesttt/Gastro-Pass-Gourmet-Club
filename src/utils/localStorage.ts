
export const getItem = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue || null;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return defaultValue || null;
  }
};

export const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
};

export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error);
  }
};

export const isUserLoggedIn = (): boolean => {
  return getItem('user') !== null;
};

export const getLoggedInUser = <T>(): T | null => {
  return getItem<T>('user');
};

export const logoutUser = (): void => {
  removeItem('user');
};
