import { describe, it, expect } from 'vitest';
import { getAirportsWithinRadius, haversineDistanceMiles, KNOWN_AIRPORTS } from '@/lib/flights/airports';

describe('airports lib', () => {
  it('haversineDistanceMiles should calculate distance correctly', () => {
    // Distance between MCI and MKC is roughly 13.7 miles
    const dist = haversineDistanceMiles(39.2976, -94.7139, 39.1232, -94.5927);
    expect(dist).toBeGreaterThan(13);
    expect(dist).toBeLessThan(14);
  });

  it('getAirportsWithinRadius should return the home airport and others within radius', () => {
    // MCI to MKC is ~12 miles.
    const airports = getAirportsWithinRadius('MCI', 50);
    const codes = airports.map(a => a.code);
    
    expect(codes).toContain('MCI');
    expect(codes).toContain('MKC');
    expect(airports[0].code).toBe('MCI'); // MCI distance to itself is 0
    expect(airports[0].distanceMiles).toBe(0);
  });

  it('getAirportsWithinRadius should not return airports outside radius', () => {
    // MCI to STL is ~230 miles.
    const airports = getAirportsWithinRadius('MCI', 100);
    const codes = airports.map(a => a.code);
    
    expect(codes).toContain('MCI');
    expect(codes).toContain('MKC');
    expect(codes).not.toContain('STL');
  });

  it('getAirportsWithinRadius should include STL if radius is large enough', () => {
    const airports = getAirportsWithinRadius('MCI', 250);
    const codes = airports.map(a => a.code);
    
    expect(codes).toContain('STL');
  });

  it('getAirportsWithinRadius should return empty array for unknown home airport', () => {
    const airports = getAirportsWithinRadius('NONEXISTENT', 1000);
    expect(airports).toEqual([]);
  });

  it('getAirportsWithinRadius should work for Milan airports', () => {
    // MXP to LIN is ~30 miles. MXP to BGY is ~47 miles.
    const airports = getAirportsWithinRadius('MXP', 40);
    const codes = airports.map(a => a.code);
    
    expect(codes).toContain('MXP');
    expect(codes).toContain('LIN');
    expect(codes).not.toContain('BGY');
  });
});
