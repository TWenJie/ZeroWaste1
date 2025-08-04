# Hello speba's Developers
## General Information about the Repo.
- this repository contains source code for back-end services of [zerowaste](https://zerowaste.cs.usm.my/spebaweb) website.
- it contains:
    - webapi (REST API).
    - webadmin (admin client).
    - nginx (example nginx configuration).
- this source code can be run using docker (using `docker-compose.yml`).
- you can learn basic docker by searching [online](https://docker-curriculum.com/) or use [my docker basic write-up](https://github.com/nurbxfit/learn/tree/master/Docker) as reference.

## Main technologies used for this system.
- [NestJs](https://nestjs.com/) (node.js based framework) for building our web API.
- [Next.js](https://nextjs.org/) (React.js base framework) for building frontend client webpage.
- MySQL database (installed on cs.usm server).
- MongoDb database.
- Nginx (installed on cs.usm server) for proxying our service to `spebaweb` namespace.

## MYSQL Database
- I've already installed and configure MySQL database on usm server.
- database informations used for the system:
```json
{
    "type":"mysql",
    "user":"speba",
    "pass":"spebaus3r",
    "host":"localhost",
    "port":"3306",
    "database": "speba", 
}
```
- database access are `strictly blocked` from external access.
- you first need to ssh into server to access it or use ssh fowarding connection options on most SQL client software to connect to our database.
    - please contact, server administator or person in-charge for `ssh credentials`. 
- the backend API (`webapi`) uses [typeorm](https://typeorm.io/) as object relation module to communicate with database.
- we can easily change database by changing the connection URL string variable in `/webapi/.env` files.
```
SQL_DATABASE_URL=mysql://speba:spebaus3r@localhost:3306/speba
```
- alternatively you can make more configuration by looking at the `/webapi/ormconfig.js` files.
- make change to the `development` case if your are changing config for development and `production`case if you are changing fpr production.
- you can easily change between `PostgresSQL` and `MySQL` by just changing the connection string.
- read more about [how nest database works](https://docs.nestjs.com/techniques/database) or consider invest in [Nest: Developer's Guide Course](https://www.udemy.com/course/nestjs-the-complete-developers-guide/).


## NGINX
- Our main point of entry to our system are handled by [nginx](http://nginx.org/en/docs/beginners_guide.html).
- nginx functions as http & https services proxies from outside to our internal services running on `0.0.0.0:3000` (API) and `0.0.0.0:3001` (WebAdmin).
- our configuration file can be found in `/etc/nginx/conf.d/default.conf`.
- inside the configuration file, we definied our two service as upstream server, so it can be reference by proxy_pass
```conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;

upstream webapi_upstream{ 
        server localhost:3000;
}

upstream webadmin_upstream{  
        server localhost:3001; 
}
```
- then we configure a basic proxy_pass config for our two running services.
- our webapi is accessable thru `/spebaapi/` namespace
- our webadmin is accessable thru `/spebaweb/` namespace. 
- we also configure caching for our `/spebaweb` page.
```conf
server{
	#listen 443 ssl;

        server_name zerowaste.cs.usm.my;
        server_tokens off;

        gzip on;
        gzip_proxied any;
        gzip_comp_level 4;
        gzip_types text/css application/javascript image/svg+xml;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # for speba api
        location /spebaapi{ 
                rewrite /spebaapi/(.*) /$1 break;
                proxy_pass http://webapi_upstream;
        }

        location /spebaweb{ 
                proxy_pass http://webadmin_upstream;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_cache_bypass $http_upgrade;
        }

        location /spebaweb/_next/static{ 
                proxy_cache STATIC;
                proxy_pass http://webadmin_upstream;
        }

        location /spebaweb/static { 
                proxy_cache STATIC;
                proxy_ignore_headers Cache-Control;
                proxy_cache_valid 30m;
                proxy_pass http://webadmin_upstream;
        }
}
``` 
- I also configured [lets encrypt SSL](https://letsencrypt.org/) for our domain using certbot(https://certbot.eff.org/)
``` conf
listen 443 ssl; # managed by Certbot
ssl_certificate /etc/letsencrypt/live/zerowaste.cs.usm.my/fullchain.pem; # managed by Certbot
ssl_certificate_key /etc/letsencrypt/live/zerowaste.cs.usm.my/privkey.pem; # managed by Certbot
include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
```
## SSL registration creds
```json
{
    "key":"0waste@dmin5768"
}
```

# Running the system.
- to run our service make sure these dependencies are installed.
  - nodejs
  - npm
- then simply follow this steps 
1. Clone this repo
```bash
git clone https://gitlab.com/nurfitridesign/speba_v3_webapi.git
```
2. cd into the directories `webadmin` and `webapi`, then run `npm install` to install node dependencies.
```bash
cd speba_v3_webapi/webadmin && npm install && cd ../webapi && npm install
```

## Using docker (options #1)

1. back to the root folder where the docker-compose.yml are located, and run `docker-compose up --build`.
```bash
cd ..
pwd # will show we in speba_v3_webapi folder
docker-compose up --build
```
2. docker-compose will now start pulling and building docker images, all database and nginx are already configured using docker. so we don't need to install it physically on our server.

3. you can take a look and  change the `docker-compose.yml` file to configure the system such as configure db password, email services, and whether or not to allow phpmyadmin. etc ...

## On machine (options #2)
- in this options we run the service inside our machine instead of docker
- we need to install the followings in our server
  - SQL database.
  - mongodb database.
  - nginx.
- install these database and get the connection strings.
- we also need to configure `nginx` to expose our services on port 80 and 443 (ssl).
  - you can refer to `/nginx/default.conf` as reference.
  - or take a look at the configuration file I've edited inside the usm server.
- next we need to configure the environment variables, take a look at the env files in `/webapi/.env` and `/webadmin/.env`
- change the db connection strings, and other things if you like to.
- after configure the environment, simply cd into each of the folder `webadmin` and `webapi` and refer the `README.md` on how to run it.

Assessment Component Documentation
What This Component Does
This is a quiz/test system for the Zero Waste educational website. Students can take assessments on different environmental topics and get scored results.
Main Features
🎯 Assessment Types

Categories: Zero Waste, 3R Principles, Composting
Difficulty Levels: Beginner, Intermediate, Advanced
Question Format: Multiple choice questions
Time Limit: 5 minutes per assessment

👤 User Experience

Students log in to take assessments
Choose a category and difficulty level
Answer 5 questions with a countdown timer
Get immediate results with score percentage
View detailed answer explanations

📊 Progress Tracking

Tracks user scores over time
Shows badges and achievements
Displays learning progress
Saves assessment history

Technical Details
Built With

Frontend: Angular + TypeScript
Backend: MongoDB database
Forms: Angular Reactive Forms
API: REST API calls to backend

Key Components
User Login → Category Selection → Assessment → Results → Progress Update
Database Integration

Questions stored in MongoDB
User progress saved automatically
Assessment results recorded with details
Categories and difficulties managed in database

How It Works
1. Starting an Assessment

User selects category (e.g., "Zero Waste")
User selects difficulty (e.g., "Beginner")
System loads 5 random questions from database
Timer starts (5 minutes)

2. Taking the Assessment

Questions displayed one at a time
User can navigate between questions
Progress bar shows completion status
Answers saved automatically

3. Scoring System

Each question worth 10 points (50 points total)
Correct answers calculated automatically
Final score shown as percentage
70% needed to pass

4. Results Display

Shows final score percentage
Lists correct/incorrect answers
Provides explanations for wrong answers
Updates user progress and badges

File Structure
assessment.component.ts    - Main component logic (1200+ lines)
assessment.component.html  - User interface template
assessment.component.scss  - Styling and layout
Key Functions
Question Management

startAssessment() - Loads questions and starts timer
getCurrentQuestion() - Gets current question to display
nextQuestion() / previousQuestion() - Navigation

Scoring & Submission

submitAssessment() - Calculates score and saves results
isAnswerCorrectEnhanced() - Checks if answer is correct
processSubmissionResults() - Updates user progress

Progress Tracking

loadUserProgress() - Gets user's assessment history
getAverageScore() - Calculates overall performance
getCurrentUserBadges() - Shows earned achievements
