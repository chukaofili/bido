const osenv = require('osenv');
const path = require('path');

const FileService = require('./FileService');
const YamlService = require('./YamlService');
const InquireService = require('./InquireService');

/**
 * ConfigService represents a singleton ConfigService. We are using a Singleton
 * pattern as the class is holding the configuration.
 * @class
 */
class ConfigService {

  /**
   * Create the ConfigService.
   * @constructor
   */
  constructor() {
    this.path = path.join(osenv.home(), this.cacheDirectory, this.configFilename);
    this.tmpPath = path.join(osenv.home(), this.cacheDirectory, this.tmpDirectory);
    this.cachePath = path.join(osenv.home(), this.cacheDirectory);
  }

  /**
   * The location of the global config file.
   */
  get location() {
    return this.path;
  }

  /**
   * The location of the global cache directory.
   */
  get cache() {
    return this.cachePath;
  }

  /**
   * The location of the temp working directory.
   */
  get tmp() {
    return this.tmpPath;
  }

  /**
   * Returns ture/false wether we are in development mode.
   */
  get isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Default options for the CLI stored in the global config.
   */
  get defaultQuestions() {
    return [{
      type: 'confirm',
      name: 'autoupdate',
      message: 'Turn on autoupdate?',
      default: false,
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager do you use?',
      default: 'yarn',
      choices: ['yarn', 'npm'],
      filter(val) {
        return val.toLowerCase();
      },
    }, {
      type: 'list',
      name: 'gitProtocol',
      message: 'Which git protocol do you prefer?',
      default: 'ssh',
      choices: ['ssh', 'https'],
      filter(val) {
        return val.toLowerCase();
      },
    }];
  }

  /**
   * Creates a YAML representation of the config values.
   */
  toYaml(values) {
    return YamlService.toYaml(values);
  }

  /**
   * Whether or not this config file exists.
   */
  get fileExists() {
    return FileService.exists(this.location);
  }

  /**
   * Writes the configuration content to the file.
   */
  createFile() {
    this.write({});
    this.createTempDirectory();
  }

  /**
   * Ensure cache/tmp directories exist.
   */
  createTempDirectory() {
    FileService.createDirectory(this.tmpPath);
  }

  /**
   * Ensure cache directories exist.
   */
  purgeTempDirectory() {
    return FileService.removeDirectoryContents(this.tmpPath);
  }

  /**
   * Writes the configuration content to the file.
   */
  createProjectCache(projectPath) {
    const projectCache = path.join(projectPath, this.projectCacheDirectory);
    FileService.createDirectory(projectCache);
    return projectCache;
  }

  /**
   * Reads the location of the config file and returns the contents as an
   * object. Silently fail and return an empty object.
   */
  read() {
    try {
      const config = YamlService.read(this.location);
      return config;
    } catch (error) {
      return {};
    }
  }

  /**
   * Writes the config's YAML to the `location`.
   */
  write(values) {
    FileService.overwrite(this.location, this.toYaml(values));
  }

  async inquireAndUpdateOptions() {
    const values = await InquireService.askQuestions({
      questions: this.defaultQuestions,
      useDefaults: false,
    });
    this.write(values);
  }

  /**
   * The name of the config file that we look for.
   */
  get configFilename() {
    return '.olympus_global';
  }

  /**
   * Global cache directory usually in the home directory.
   */
  get cacheDirectory() {
    return '.olympus';
  }

  /**
   * Directory for config files used by the CLI when generating.
   */
  get projectCacheDirectory() {
    return 'olympus';
  }

  /**
   * Directory for temporary files used by the CLI when generating.
   */
  get tmpDirectory() {
    return '.tmp';
  }

}


module.exports = new ConfigService();
