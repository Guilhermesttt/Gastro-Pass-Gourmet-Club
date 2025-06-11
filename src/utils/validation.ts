
export interface ValidationError {
  [key: string]: string;
}

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'O e-mail é obrigatório';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'E-mail inválido';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'A senha é obrigatória';
  }
  
  if (password.length < 6) {
    return 'A senha deve ter no mínimo 6 caracteres';
  }
  
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name.trim()) {
    return 'O nome é obrigatório';
  }
  
  return null;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return 'Confirme sua senha';
  }
  
  if (password !== confirmPassword) {
    return 'As senhas não conferem';
  }
  
  return null;
};
