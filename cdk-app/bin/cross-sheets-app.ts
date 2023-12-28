#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CrossSheetsAppStack } from '../lib/cross-sheets-app-stack';

const app = new cdk.App();
new CrossSheetsAppStack(app, 'CrossSheetsAppStack');
