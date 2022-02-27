// SupportBot | Emerald Services
// Command Structure

class Command {
  constructor(options) {
    this.name = options.name;
    this.description = options.description;
    this.permissions = options.permissions || [];
    this.options = options.options || [];
    this.run = options.run;
    this.defaultPermission = true;
  }
}
module.exports = Command;
