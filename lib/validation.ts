export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phonePattern = /^(03\d{2}[-\s]?\d{7}|\+92\s?3\d{2}[-\s]?\d{7})$/;

export const isValidEmail = (value: string) => emailPattern.test(value);
export const isValidPhone = (value: string) => phonePattern.test(value);
