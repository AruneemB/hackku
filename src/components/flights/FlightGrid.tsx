"use client";

import React from "react";
import type { Flight } from "@/types";
import { Button } from "@/components/ui/Button";

interface FlightGridProps {
  flights: Flight[];
  onSelect: (flight: Flight) => void;
  homeAirport?: string;
}

/**
 * COMPONENT: FlightGrid (Track A)
 * DESCRIPTION: Renders a sorted list of flights as a grid.
 *   Shows departure date, origin airport (with highlight if not home),
 *   price, Saturday-night savings, and a select button.
 */
export function FlightGrid({ flights, onSelect, homeAirport }: FlightGridProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Departure
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Origin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Savings
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {flights.map((flight) => {
            const isNotHome = homeAirport && flight.originAirport !== homeAirport;
            
            return (
              <tr key={flight.id} className="hover:bg-gray-50 transition-colors">
                {/* Departure Date Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(flight.outbound.departureTime)}
                </td>

                {/* Origin Airport Badge Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isNotHome
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {flight.originAirport}
                    </span>
                    {isNotHome && (
                      <span className="text-[10px] text-gray-500 mt-1">
                        {flight.distanceFromHomeAirportMiles} miles from home
                      </span>
                    )}
                  </div>
                </td>

                {/* Price Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {formatCurrency(flight.priceUsd)}
                </td>

                {/* Saturday-Night-Stay Indicator + Savings Chip */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {flight.saturdayNightStay ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">🌙 Sat-stay</span>
                      {flight.saturdayNightSavingsUsd > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Save {formatCurrency(flight.saturdayNightSavingsUsd)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>

                {/* Select Button Column */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onSelect(flight)}
                  >
                    Select
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
