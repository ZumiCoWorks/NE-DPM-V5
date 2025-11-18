-- Fix the trigger that's creating profiles with invalid role and create admin user

-- First, let's disable the problematic trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- Create admin user directly
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@pilot.test';
    
    IF admin_user_id IS NULL THEN
        -- Create the auth user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', -- instance_id
            gen_random_uuid(), -- id
            'authenticated', -- aud
            'authenticated', -- role
            'admin@pilot.test', -- email
            crypt('pilot123', gen_salt('bf')), -- encrypted_password
            NOW(), -- email_confirmed_at
            NULL, -- invited_at
            '', -- confirmation_token
            NULL, -- confirmation_sent_at
            '', -- recovery_token
            NULL, -- recovery_sent_at
            '', -- email_change_token_new
            '', -- email_change
            NULL, -- email_change_sent_at
            NULL, -- last_sign_in_at
            '{"provider": "email", "providers": ["email"]}', -- raw_app_meta_data
            '{"full_name": "Pilot Admin"}', -- raw_user_meta_data
            false, -- is_super_admin
            NOW(), -- created_at
            NOW(), -- updated_at
            NULL, -- phone
            NULL, -- phone_confirmed_at
            '', -- phone_change
            '', -- phone_change_token
            NULL, -- phone_change_sent_at
            '', -- email_change_token_current
            0, -- email_change_confirm_status
            NULL, -- banned_until
            '', -- reauthentication_token
            NULL, -- reauthentication_sent_at
            false, -- is_sso_user
            NULL -- deleted_at
        ) RETURNING id INTO admin_user_id;
        
        RAISE NOTICE 'Created auth user with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;
    
    -- Create or update the profile with correct role
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin@pilot.test',
        'Pilot',
        'Admin',
        'event_organizer',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RAISE NOTICE 'Admin profile created/updated successfully';
END $$;

-- Re-enable triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;