export const createEmptyPersonalInfo = () => ({
  profilePhoto: '',
  fullName: '',
  identityDocument: '',
  phone: '',
  birthDate: '',
  gender: '',
  email: '',
  language: 'es',
});

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function isAtLeast18(birthDate, today = new Date()) {
  const date = birthDate instanceof Date ? birthDate : parseLocalDate(birthDate);
  if (!date || date > today) return false;

  let age = today.getFullYear() - date.getFullYear();
  const beforeBirthday =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 18;
}

export function dateToLocalIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseBirthDate(value) {
  return parseLocalDate(value);
}

export function validatePersonalInfo(values, copy, today = new Date()) {
  const errors = {};
  const name = values.fullName.trim();
  const document = values.identityDocument;
  const phone = values.phone;
  const email = values.email.trim();

  if (!values.profilePhoto) errors.profilePhoto = copy.errors.photo;

  if (!name) errors.fullName = copy.errors.nameRequired;
  else if (Array.from(name).length > 50) errors.fullName = copy.errors.nameLength;
  else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/.test(name)) errors.fullName = copy.errors.nameInvalid;

  if (!document) errors.identityDocument = copy.errors.documentRequired;
  else if (!/^\d{6,10}$/.test(document)) errors.identityDocument = copy.errors.documentInvalid;

  if (!phone) errors.phone = copy.errors.phoneRequired;
  else if (!/^\d{10}$/.test(phone)) errors.phone = copy.errors.phoneInvalid;

  if (!values.birthDate) errors.birthDate = copy.errors.birthDateRequired;
  else {
    const date = parseLocalDate(values.birthDate);
    if (!date || date > today) errors.birthDate = copy.errors.futureDate;
    else if (!isAtLeast18(date, today)) errors.birthDate = copy.errors.underage;
  }

  if (!values.gender) errors.gender = copy.errors.genderRequired;

  if (!email) errors.email = copy.errors.emailRequired;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = copy.errors.emailInvalid;

  if (!values.language) errors.language = copy.errors.languageRequired;
  return errors;
}
