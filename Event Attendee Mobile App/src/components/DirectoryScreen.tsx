import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

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
      <div className="p-4 bg-white border-b">
        <h1 className="text-gray-900">Points of Interest</h1>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {pointsOfInterest.map((poi) => (
            <Card key={poi.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-gray-900">{poi.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{poi.category}</p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => onGetDirections(poi)}
                >
                  Get Directions
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
