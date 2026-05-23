const fallbackCountries = [
  { name: 'Brasil', code: 'BR' },
];

const fallbackCities = {
  Brasil: ['Acre',
    'Alagoas',
    'Amapá',
    'Amazonas',
    'Bahia',
    'Ceará',
    'Distrito Federal',
    'Espírito Santo',
    'Goiás',
    'Maranhão',
    'Mato Grosso',
    'Mato Grosso do Sul',
    'Minas Gerais',
    'Pará',
    'Paraíba',
    'Paraná',
    'Pernambuco',
    'Piauí',
    'Rio de Janeiro',
    'Rio Grande do Norte',
    'Rio Grande do Sul',
    'Rondônia',
    'Roraima',
    'Santa Catarina',
    'São Paulo',
    'Sergipe',
    'Tocantins'
  ],

};

export async function fetchCountries() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,translations', {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Countries API failed');
    const rows = await response.json();
    return rows
      .map((country) => ({
        name: country.translations?.por?.common || country.name?.common,
        code: country.cca2,
      }))
      .filter((country) => country.name && country.code)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  } catch {
    return fallbackCountries;
  }
}

export async function fetchCities(countryName) {
  if (!countryName) return [];
  if (fallbackCities[countryName]) return fallbackCities[countryName];

  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ country: countryName }),
    });
    if (!response.ok) throw new Error('Cities API failed');
    const result = await response.json();
    if (Array.isArray(result.data)) return result.data.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  } catch {
    return fallbackCities[countryName] || [];
  }

  return fallbackCities[countryName] || [];
}
