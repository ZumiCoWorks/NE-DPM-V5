import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { MapPin } from "lucide-react";

interface POI {
  id: string;
  name: string;
  category: string;
}

interface DirectoryScreenProps {
  onGetDirections: (poi: POI) => void;
}

const pointsOfInterest: POI[] = [
  { id: "1", name: "BCom Project 1", category: "Exhibit" },
  { id: "2", name: "PGDI Project 2", category: "Exhibit" },
  { id: "3", name: "Bathrooms", category: "Facility" },
  { id: "4", name: "BCom Project 3", category: "Exhibit" },
  { id: "5", name: "Main Entrance", category: "Facility" },
  { id: "6", name: "Food Court", category: "Facility" },
  { id: "7", name: "PGDI Project 5", category: "Exhibit" },
  { id: "8", name: "Information Desk", category: "Facility" },
  { id: "9", name: "Emergency Exit", category: "Facility" },
  { id: "10", name: "BCom Project 7", category: "Exhibit" },
];

export function DirectoryScreen({ onGetDirections }: DirectoryScreenProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-200">
        <h1 className="text-gray-900 text-lg font-semibold">Points of Interest</h1>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {pointsOfInterest.map((poi) => (
            <Card key={poi.id} className="p-4 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-gray-900 font-medium">{poi.name}</h3>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                      {poi.category}
                    </span>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => onGetDirections(poi)}
                  className="gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Directions
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
