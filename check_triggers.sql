-- Check for triggers on tables that might be accessing profiles
SELECT 
    event_object_table AS table_name,
    trigger_name,
    action_statement,
    action_timing
FROM 
    information_schema.triggers 
WHERE 
    event_object_schema = 'public'
    AND (action_statement LIKE '%profiles%' OR action_statement LIKE '%profile%')
ORDER BY 
    event_object_table;