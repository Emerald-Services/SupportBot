
// SupportBot | Emerald Services
// Addon Structure
class Command {
  constructor(options) {
    this.name = options.name;
    this.description = options.description;
    this.permissions = options.permissions;
    this.options = options.options || [];
    this.run = options.run;
    this.defaultPermission = true;
  }

  // Method to dynamically update options
  setOptions(options) {
    this.options = options;
  }
}

class Event {
  constructor(event, run) {
    this.event = event;
    this.run = run;
  }
}

module.exports = { Command, Event };
