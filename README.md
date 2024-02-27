# Cross Sheets APP

A CDK NodeJS Lambda example app using Cognito + API Gateway + Lambda.
It uses Cognito Groups with IAM Roles with service permissions that are exchanged by Cognito JWT tokens.


![cognito-lambda.png](docs%2Fcognito-lambda.png)

### Inspired on CrossFit benchmarks workouts - app for registering Personal Records

The example app was based on a Google spreadsheet of mine used for registering my CrossFit Personal Records. Therefore, it has three entities:
Groups – CrossFit workouts are divided into some groups: The Heroes, Girls, Barbell, Gymnastics, Notables, etc.
Benchmarks – The workout itself, the picture on the left shows some workouts from CrossFit
Results – an entry that represents a workout execution of a particular benchmark.
