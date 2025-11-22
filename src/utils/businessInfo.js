/**
 * Utilitaires pour manipuler les informations d'établissement
 * et transformer les paramètres stockés dans la base en objet exploitable.
 */

const DEFAULT_HOURS_TEMPLATE = {
  open: '08:00',
  close: '22:00',
  closed: false
};

export const DEFAULT_OPENING_HOURS = {
  monday: { ...DEFAULT_HOURS_TEMPLATE },
  tuesday: { ...DEFAULT_HOURS_TEMPLATE },
  wednesday: { ...DEFAULT_HOURS_TEMPLATE },
  thursday: { ...DEFAULT_HOURS_TEMPLATE },
  friday: { ...DEFAULT_HOURS_TEMPLATE },
  saturday: { ...DEFAULT_HOURS_TEMPLATE },
  sunday: { ...DEFAULT_HOURS_TEMPLATE }
};

export const DEFAULT_BUSINESS_INFO = {
  name: 'Blossom Café',
  slogan: "L'art du thé et de la douceur",
  address: '',
  phone: '',
  email: '',
  hours: { ...DEFAULT_OPENING_HOURS }
};

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

export const parseOpeningHours = (value) => {
  if (!value) {
    return { ...DEFAULT_OPENING_HOURS };
  }

  let parsed = value;

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      logger.debug('Impossible de parser opening_hours, utilisation des valeurs par défaut');
      return { ...DEFAULT_OPENING_HOURS };
    }
  }

  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ...DEFAULT_OPENING_HOURS };
  }

  const hours = {};

  DAY_KEYS.forEach((day) => {
    const source = parsed[day];
    if (!source) {
      hours[day] = { ...DEFAULT_HOURS_TEMPLATE };
      return;
    }

    if (typeof source === 'string') {
      // Valeur en texte libre (ex: "08:00 - 22:00" ou "Fermé")
      const trimmed = source.trim();
      if (/fermé/i.test(trimmed)) {
        hours[day] = { ...DEFAULT_HOURS_TEMPLATE, closed: true };
      } else {
        const [open = DEFAULT_HOURS_TEMPLATE.open, close = DEFAULT_HOURS_TEMPLATE.close] = trimmed.split('-').map((p) => p.trim());
        hours[day] = { open, close, closed: false };
      }
    } else {
      hours[day] = {
        open: source.open || DEFAULT_HOURS_TEMPLATE.open,
        close: source.close || DEFAULT_HOURS_TEMPLATE.close,
        closed: Boolean(source.closed)
      };
    }
  });

  return hours;
};

export const transformSettingsToBusinessInfo = (settings = []) => {
  if (!Array.isArray(settings)) {
    return { ...DEFAULT_BUSINESS_INFO };
  }

  const map = Object.fromEntries(
    settings
      .filter((item) => item && item.setting_key !== undefined)
      .map((item) => [item.setting_key, item.setting_value])
  );

  return {
    name: map.app_name || DEFAULT_BUSINESS_INFO.name,
    slogan: map.welcome_message || DEFAULT_BUSINESS_INFO.slogan,
    address: map.restaurant_address || DEFAULT_BUSINESS_INFO.address,
    phone: map.contact_phone || DEFAULT_BUSINESS_INFO.phone,
    email: map.contact_email || DEFAULT_BUSINESS_INFO.email,
    hours: parseOpeningHours(map.opening_hours)
  };
};

export default DEFAULT_BUSINESS_INFO;

