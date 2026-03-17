import os
import argparse
import random
from datetime import datetime, timedelta, timezone
from faker import Faker
from supabase import create_client, Client
from dotenv import load_dotenv
from locations import nyc

fake = Faker()
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") 

if not (SUPABASE_URL and SUPABASE_SERVICE_KEY):
	raise RuntimeError ("Missing Supbase URL or Service Key in .env file")

supabase: Client = create_client (SUPABASE_URL, SUPABASE_SERVICE_KEY)

def seed_users (count: int) -> list[str]:
	print(f"Creating {count} fake (realistic) users")

	user_ids = []

	for _ in range (count): 
		email = fake.unique.email()
		result = supabase.auth.admin.create_user (
			{
				"email": email, 
				"password": "morganstanleyhackathon", 
				"email_confirm": True,
				"user_metadata" : {
					"display_name": fake.name(),
				}, 
			} 
		) 

		uid = result.user.id
		user_ids.append(uid)

		supabase.table("profiles").update (
			{ 
				"display_name": fake.name(),	
				"bio": fake.sentence(nb_words=15),
			} 
		).eq("id", uid).execute()

		print (f" User -> [{email}, {uid}]")
	return user_ids


def seed_events (user_ids: list[str], count: int, history_weeks: int, future_days: int) -> list[str]:
	print(f"Creating {count} fake (realistic) events")
	locations, event_ids = nyc, []

	for idx in range (count):
		location_name, base_lat, base_long = random.choice(locations)

		lat = base_lat + random.uniform(-0.005, 0.005)
		long = base_long + random.uniform(-0.005, 0.005)

		# Bias event timing toward historical data so weekly engagement charts
		# have meaningful variation in recent weeks.
		if random.random() < 0.75:
			day_offset = -random.randint(0, history_weeks * 7)
		else:
			day_offset = random.randint(0, future_days)
		start_dt = datetime.now(timezone.utc) + timedelta(
			days = day_offset,
			hours = random.randint(8, 20),
		)

		end_dt = start_dt + timedelta (hours = random.randint(1, 4))
 
		organizer = random.choice(["Community Food Bank", "Local Church", "Neighborhood Association",
								   "School District", "City Partnership", "Volunteer Network"])

		payload = {
			"title": f"{fake.bs().title()} Food Drive",
			"description": fake.paragraph(nb_sentences=3),
			"address": f"{fake.building_number()} {fake.street_name()}, {location_name}, NY",
			"city": location_name,
			"lat": round(lat, 6),
			"lng": round(long, 6),
			"start_time": start_dt.isoformat(),
			"end_time": end_dt.isoformat(),
			"organizer_name": organizer,
			"created_by_user_id": random.choice(user_ids),
        }
 
		result = supabase.table("events").insert(payload).execute()
		event_id = result.data[0]["id"]
		event_ids.append(event_id)

		print(f" Event '{payload['title']}' @ {payload['address']}")
		
	return event_ids 
	
def seed_attendees (user_ids: list[str], event_ids: list[str]) -> None: 
	print(f"Assigning attendees...")
	rows = []

	for event_id in event_ids:
		attendee_count = random.randint(1, min(8, len(user_ids)))
		attendees = random.sample(user_ids, attendee_count)
		for uid in attendees:
			rows.append({"event_id": event_id, "user_id": uid})

	# Upsert handles the unique constraint gracefully if you run seed more than once
	supabase.table("event_attendees").upsert(rows, on_conflict="event_id, user_id").execute()
	print(f" {len(rows)} attendee assignments created")

def main ():
	parser = argparse.ArgumentParser(description="Seed the Lemontree DB")
	parser.add_argument("--users", type=int, default=5, help="Number of fake users to create")
	parser.add_argument("--events", type=int, default=12, help="Number of fake events to create")
	parser.add_argument(
		"--history-weeks",
		type=int,
		default=12,
		help="How many weeks of historical events to generate",
	)
	parser.add_argument(
		"--future-days",
		type=int,
		default=21,
		help="How many future days to include in generated events",
	)
	args = parser.parse_args()

	print("Seeding database...")
	user_ids = seed_users(args.users)
	event_ids = seed_events(user_ids, args.events, args.history_weeks, args.future_days)
	seed_attendees(user_ids, event_ids)
	print("Hopefully it worked ...")


if __name__ == "__main__":
	main()
