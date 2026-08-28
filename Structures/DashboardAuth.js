const { fullPermissions, hasPermission, canAccessConfig } = require("./DashboardPermissions.js");

function grantServiceAccess(req) {
  req.dashboardService = true;
  req.dashboardPermissions = fullPermissions();
  req.dashboardRole = "service";
  req.dashboardIsOwner = true;
}

function forbid(res, message = "Forbidden") {
  return res.status(403).json({ success: false, error: message });
}

function createPermissionMiddleware(getPermissions) {
  return function requirePermission(permission) {
    return (req, res, next) => {
      if (req.dashboardService) return next();
      const perms = getPermissions(req) || req.dashboardPermissions;
      if (hasPermission(perms, permission)) return next();
      return forbid(res);
    };
  };
}

function createConfigMiddleware(getPermissions) {
  return function requireConfigAccess(mode = "view") {
    return (req, res, next) => {
      if (req.dashboardService) return next();
      const perms = getPermissions(req) || req.dashboardPermissions;
      const file = req.params?.file || req.body?.filename;
      if (!file) return next();
      if (!canAccessConfig(perms, file, mode)) return forbid(res);
      return next();
    };
  };
}

function assertConfigFilesEditable(permissions, files, res) {
  if (!permissions) return forbid(res);
  for (const file of files) {
    if (!canAccessConfig(permissions, file, "edit")) {
      return forbid(res, `No permission to edit ${file}.yml`);
    }
  }
  return null;
}

module.exports = {
  grantServiceAccess,
  forbid,
  createPermissionMiddleware,
  createConfigMiddleware,
  assertConfigFilesEditable,
  fullPermissions,
  hasPermission,
  canAccessConfig,
};
