import yaml from 'js-yaml';
import fs from 'fs';
import config from './config';

try {
    const configYml = yaml.safeLoad(fs.readFileSync(process.env.YML, 'utf8'));
    config.settings = configYml[process.env.NODE_ENV];
    config.api = configYml.api;
} catch (e) {
    console.log(e);
}

module.exports = config;
