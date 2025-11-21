SELECT 
  id, 
  name, 
  point_type,
  gps_lat,
  gps_lng,
  event_id
FROM navigation_points
WHERE event_id = '5eb534e9-03ff-4e59-b3a5-b17eeab84316'
ORDER BY point_type, name;
