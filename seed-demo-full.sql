-- Demo seed inserts for attendees, sponsors, staff_accounts, leads

-- sponsors
INSERT INTO sponsors (id,name,contact_email) VALUES ('sponsor_1','Sponsor A','manager@sponsorA.com') ON CONFLICT DO NOTHING;
INSERT INTO sponsors (id,name,contact_email) VALUES ('sponsor_2','Sponsor B','manager@sponsorB.com') ON CONFLICT DO NOTHING;

-- staff_accounts
INSERT INTO staff_accounts (id,sponsor_id,email) VALUES ('staff_1','sponsor_1','sales1@sponsorA.com') ON CONFLICT DO NOTHING;
INSERT INTO staff_accounts (id,sponsor_id,email) VALUES ('staff_2','sponsor_1','sales2@sponsorA.com') ON CONFLICT DO NOTHING;

-- attendees
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_1','guest1@example.com','Guest1','Demo','Company 1','Manager','General','event_demo','QR_att_1') ON CONFLICT DO NOTHING;
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_2','guest2@example.com','Guest2','Demo','Company 2','Manager','General','event_demo','QR_att_2') ON CONFLICT DO NOTHING;
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_3','guest3@example.com','Guest3','Demo','Company 3','Manager','General','event_demo','QR_att_3') ON CONFLICT DO NOTHING;
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_4','guest4@example.com','Guest4','Demo','Company 4','Manager','General','event_demo','QR_att_4') ON CONFLICT DO NOTHING;
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_5','guest5@example.com','Guest5','Demo','Company 5','Manager','General','event_demo','QR_att_5') ON CONFLICT DO NOTHING;
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_6','guest6@example.com','Guest6','Demo','Company 6','Manager','General','event_demo','QR_att_6') ON CONFLICT DO NOTHING;
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_7','guest7@example.com','Guest7','Demo','Company 7','Manager','General','event_demo','QR_att_7') ON CONFLICT DO NOTHING;
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_8','guest8@example.com','Guest8','Demo','Company 8','Manager','General','event_demo','QR_att_8') ON CONFLICT DO NOTHING;
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_9','guest9@example.com','Guest9','Demo','Company 9','Manager','General','event_demo','QR_att_9') ON CONFLICT DO NOTHING;
INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('att_10','guest10@example.com','Guest10','Demo','Company 10','Manager','General','event_demo','QR_att_10') ON CONFLICT DO NOTHING;

-- leads
INSERT INTO leads (id,sponsor_id,staff_id,attendee_id,event_id,rating,note) VALUES ('lead_1','sponsor_1','staff_1','att_1','event_demo',5,'Hot lead') ON CONFLICT DO NOTHING;
INSERT INTO leads (id,sponsor_id,staff_id,attendee_id,event_id,rating,note) VALUES ('lead_2','sponsor_1','staff_2','att_2','event_demo',4,'Follow up') ON CONFLICT DO NOTHING;