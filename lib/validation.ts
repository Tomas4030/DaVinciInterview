// lib/validation.ts
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  // Portugal: +351XXXXXXXXX or +351 XXX XXX XXX or 9XXXXXXXX
  const phoneRegex =
    /^(?:\+351\s?)?(?:91|92|93|96|9[0-9]|2[0-9]{7})[\s-]?[\d\s-]{7,8}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, "");

  // Se não começa com 351, adiciona
  if (!cleaned.startsWith("351")) {
    // Se tem 9 dígitos (começando com 9), adiciona código de país
    if (cleaned.length === 9 && cleaned.startsWith("9")) {
      return "+351" + cleaned;
    }
  }

  // Se tem 12 dígitos (351 + 9), formata como +351XXXXXXXXX
  if (cleaned.length === 12) {
    return "+" + cleaned.substring(0, 3) + cleaned.substring(3);
  }

  return phone;
};
