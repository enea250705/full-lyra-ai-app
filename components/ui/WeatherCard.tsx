import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cloud, Sun, CloudRain, Wind, Eye, Thermometer } from 'lucide-react-native';
import { useI18n } from '@/i18n';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  cloudiness: number;
  weatherType: string;
  uvIndex: number;
  visibility: number;
  location: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
  timezone: string;
}

interface WeatherCardProps {
  weather: WeatherData;
  style?: any;
}

const getWeatherIcon = (weatherType: string, size: number = 24) => {
  switch (weatherType.toLowerCase()) {
    case 'clear':
      return <Sun size={size} color="#FFD700" />;
    case 'clouds':
      return <Cloud size={size} color="#87CEEB" />;
    case 'rain':
      return <CloudRain size={size} color="#4682B4" />;
    default:
      return <Cloud size={size} color="#87CEEB" />;
  }
};

const getWeatherGradient = (weatherType: string) => {
  switch (weatherType.toLowerCase()) {
    case 'clear':
      return ['#FFD700', '#FFA500'];
    case 'clouds':
      return ['#87CEEB', '#4682B4'];
    case 'rain':
      return ['#4682B4', '#2F4F4F'];
    default:
      return ['#87CEEB', '#4682B4'];
  }
};

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, style }) => {
  const { t } = useI18n();
  const gradient = getWeatherGradient(weather.weatherType);

  return (
    <LinearGradient
      colors={gradient}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Text style={styles.city}>{weather.location.city}</Text>
          <Text style={styles.country}>{weather.location.country}</Text>
        </View>
        <View style={styles.weatherIcon}>
          {getWeatherIcon(weather.weatherType, 32)}
        </View>
      </View>

      <View style={styles.temperatureContainer}>
        <Text style={styles.temperature}>{Math.round(weather.temperature)}°C</Text>
        <Text style={styles.weatherType}>{t(`weather.type_${weather.weatherType.toLowerCase()}`)}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <View style={styles.detailIcon}>
            <Thermometer size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.detailText}>{t('weather.feels_like', { temp: String(Math.round(weather.temperature)) })}</Text>
        </View>

        <View style={styles.detailItem}>
          <View style={styles.detailIcon}>
            <Wind size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.detailText}>{t('weather.wind_speed', { value: String(weather.windSpeed) })}</Text>
        </View>

        <View style={styles.detailItem}>
          <View style={styles.detailIcon}>
            <Eye size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.detailText}>{t('weather.visibility', { value: String(weather.visibility) })}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t('weather.humidity')}</Text>
          <Text style={styles.statValue}>{weather.humidity}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t('weather.uv_index')}</Text>
          <Text style={styles.statValue}>{weather.uvIndex}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t('weather.pressure')}</Text>
          <Text style={styles.statValue}>{weather.pressure} hPa</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flex: 1,
  },
  city: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  country: {
    fontSize: 14,
    color: '#F0F0F0',
    marginTop: 2,
  },
  weatherIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  temperatureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weatherType: {
    fontSize: 16,
    color: '#F0F0F0',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#F0F0F0',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#F0F0F0',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default WeatherCard;