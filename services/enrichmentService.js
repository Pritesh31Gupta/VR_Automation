const axios = require('axios');

class EnrichmentService {
  async enrichName(name) {
    try {
      const response = await axios.get(`https://api.nationalize.io`, {
        params: { name: name.trim() }
      });

      const data = response.data;
      
      if (!data.country || data.country.length === 0) {
        return {
          name: name.trim(),
          mostLikelyCountry: 'Unknown',
          countryCode: 'XX',
          probability: 0,
          status: 'To Check'
        };
      }

      // Get the country with highest probability
      const topCountry = data.country.reduce((prev, current) => 
        (prev.probability > current.probability) ? prev : current
      );

      return {
        name: name.trim(),
        mostLikelyCountry: this.getCountryName(topCountry.country_id),
        countryCode: topCountry.country_id,
        probability: topCountry.probability,
        status: topCountry.probability > 0.6 ? 'Verified' : 'To Check'
      };
    } catch (error) {
      console.error(`Error enriching name ${name}:`, error.message);
      return {
        name: name.trim(),
        mostLikelyCountry: 'Error',
        countryCode: 'XX',
        probability: 0,
        status: 'To Check'
      };
    }
  }

  async enrichBatch(names) {
    // Process all names concurrently with Promise.all
    const promises = names.map(name => this.enrichName(name));
    return await Promise.all(promises);
  }

  getCountryName(code) {
    const countries = {
      'US': 'United States',
      'IN': 'India',
      'GB': 'United Kingdom',
      'JP': 'Japan',
      'CN': 'China',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'BR': 'Brazil',
      'RU': 'Russia',
      'KR': 'South Korea',
      'AU': 'Australia',
      'CA': 'Canada',
      'MX': 'Mexico',
      'NL': 'Netherlands',
      'SE': 'Sweden',
      'PL': 'Poland',
      'TR': 'Turkey',
      'SA': 'Saudi Arabia'
    };
    return countries[code] || code;
  }
}

module.exports = new EnrichmentService();