const fs = require("fs");

var handlingData = {}; // All handling data will be stored here

var dlcNames = {}; // This will store which vehicle belongs in which DLC. This is derived from the files names when reading .meta files.

function Vec3(x, y, z) {
    this.x = (x == null) ? 0.0 : x;
    this.y = (y == null) ? 0.0 : y;
    this.z = (z == null) ? 0.0 : z;
}

Vec3.prototype.equals = function(rhs) {
    return
    this.x === rhs.x &&
    this.y === rhs.y &&
    this.z === rhs.z;
};

Vec3.prototype.toString = function() {
    return "[ " + this.x + ", " + this.y + ", " + this.z + " ]";
};

function is_string(val) {
    return (typeof val) == "string";
}

// These are the properties that make up the simplified handling stats of a car
const simpleProperties = [
    "fMass",
    "fInitialDragCoeff",
    "fDownforceModifier",
    "fDriveBiasFront",
    "nInitialDriveGears",
    "fInitialDriveForce",
    "fInitialDriveMaxFlatVel",
    "fBrakeForce",
    "fBrakeBiasFront",
    "fSteeringLock",
    "fTractionCurveMax",
    "fTractionLossMult",
    "fSuspensionUpperLimit",
    "strModelFlags",
    "strHandlingFlags",
    "strAdvancedFlags"
];

// Categories for each property, with the value of "missing_property" being used for anything that's not contained in the list
// These categories won't be matched by search words. For that, see the keywords table below. These are only used to group properties together.
const propertyCategories = {
    missing_property: "Misc",
    fMass: "Weight/general",
    fInitialDragCoeff: "Drivetrain/speed",
    fDownforceModifier: "Traction/turning",
    fPercentSubmerged: "Misc",
    vecCentreOfMassOffset: "Weight/general",
    vecInertiaMultiplier: "Weight/general",
    fDriveBiasFront: "Drivetrain/speed",
    nInitialDriveGears: "Drivetrain/speed",
    fInitialDriveForce: "Drivetrain/speed",
    fDriveInertia: "Drivetrain/speed",
    fClutchChangeRateScaleUpShift: "Drivetrain/speed",
    fClutchChangeRateScaleDownShift: "Drivetrain/speed",
    fInitialDriveMaxFlatVel: "Drivetrain/speed",
    fBrakeForce: "Suspension/braking",
    fBrakeBiasFront: "Suspension/braking",
    fHandBrakeForce: "Suspension/braking",
    fSteeringLock: "Traction/turning",
    fTractionCurveMax: "Traction/turning",
    fTractionCurveMin: "Traction/turning",
    fTractionCurveLateral: "Traction/turning",
    fTractionSpringDeltaMax: "Traction/turning",
    fLowSpeedTractionLossMult: "Traction/turning",
    fCamberStiffnesss: "Suspension/braking",
    fTractionBiasFront: "Traction/turning",
    fTractionLossMult: "Traction/turning",
    fSuspensionForce: "Suspension/braking",
    fSuspensionCompDamp: "Suspension/braking",
    fSuspensionReboundDamp: "Suspension/braking",
    fSuspensionUpperLimit: "Suspension/braking",
    fSuspensionLowerLimit: "Suspension/braking",
    fSuspensionRaise: "Suspension/braking",
    fSuspensionBiasFront: "Suspension/braking",
    fAntiRollBarForce: "Suspension/braking",
    fAntiRollBarBiasFront: "Suspension/braking",
    fRollCentreHeightFront: "Weight/general",
    fRollCentreHeightRear: "Weight/general",
    fCollisionDamageMult: "Misc",
    fWeaponDamageMult: "Misc",
    fDeformationDamageMult: "Misc",
    fEngineDamageMult: "Misc",
    fPetrolTankVolume: "Misc",
    fOilVolume: "Misc",
    fSeatOffsetDistX: "Misc",
    fSeatOffsetDistY: "Misc",
    fSeatOffsetDistZ: "Misc",
    nMonetaryValue: "Misc",
    strModelFlags: "Flags",
    strHandlingFlags: "Flags",
    strDamageFlags: "Flags",
    fBackEndPopUpCarImpulseMult: "Suspension/braking",
    fBackEndPopUpBuildingImpulseMult: "Suspension/braking",
    fBackEndPopUpMaxDeltaSpeed: "Suspension/braking",
    fCamberFront: "Traction/turning",
    fCastor: "Traction/turning",
    fToeFront: "Traction/turning",
    fCamberRear: "Traction/turning",
    fToeRear: "Traction/turning",
    fMaxDriveBiasTransfer: "Drivetrain/speed",
    fEngineResistance: "Drivetrain/speed",
    strAdvancedFlags: "Flags"
};

// Custom keywords for returning a certain set of properties
const propertyKeywords = {
    drivetrain: [
        "fDriveBiasFront",
        "nInitialDriveGears",
        "fInitialDriveForce",
        "fClutchChangeRateScaleUpShift",
        "fClutchChangeRateScaleDownShift",
        "fMaxDriveBiasTransfer"
    ],
    speed: [
        "fInitialDragCoeff",
        "nInitialDriveGears",
        "fInitialDriveForce",
        "fClutchChangeRateScaleUpShift",
        "fClutchChangeRateScaleDownShift",
        "fInitialDriveMaxFlatVel"
    ],
    power: [
        "nInitialDriveGears",
        "fInitialDriveForce",
        "fInitialDriveMaxFlatVel"
    ],
    engine: [
        "fInitialDragCoeff",
        "nInitialDriveGears",
        "fInitialDriveForce",
        "fInitialDriveMaxFlatVel",
        "fEngineResistance"
    ],
    traction: [
        "fDownforceModifier",
        "fTractionCurveMax",
        "fTractionCurveMin",
        "fTractionCurveLateral",
        "fTractionSpringDeltaMax",
        "fLowSpeedTractionLossMult",
        "fTractionBiasFront",
        "fTractionLossMult"
    ],
    braking: [
        "fBrakeForce",
        "fBrakeBiasFront",
        "fHandBrakeForce"
    ],
    cornering: [
        "fDownforceModifier",
        "fSteeringLock",
        "fTractionCurveMax",
        "fTractionCurveLateral",
        "fTractionBiasFront",
        "fTractionLossMult",
        "fCamberFront",
        "fCamberRear"
    ],
    turning: [
        "fDownforceModifier",
        "fSteeringLock",
        "fTractionCurveMax",
        "fTractionCurveLateral",
        "fTractionBiasFront",
        "fTractionLossMult",
        "fCamberFront",
        "fCamberRear"
    ],
    grip: [
        "fDownforceModifier",
        "fTractionCurveMax",
        "fTractionSpringDeltaMax",
        "fLowSpeedTractionLossMult",
        "fTractionBiasFront",
        "fTractionLossMult"
    ],
    suspension: [
        "fSuspensionForce",
        "fSuspensionCompDamp",
        "fSuspensionReboundDamp",
        "fSuspensionUpperLimit",
        "fSuspensionLowerLimit",
        "fSuspensionRaise",
        "fSuspensionBiasFront",
        "fAntiRollBarForce",
        "fAntiRollBarBiasFront",
        "strHandlingFlags"
    ],
    antiroll: [
        "fAntiRollBarForce",
        "fAntiRollBarBiasFront"
    ]
};

// Descriptions of bitmask components in "flag" type properties.
// There has to be exactly 32 in each array, in the right order.
// The array index corresponds to the bit it names in the bitmask.
// For example strHandlingFlags[5] should have the name for the flag (0x1 << 5)
// Undocumented flags are named after their value in the following format: "(0x1 << 2)"
const flagNames = {
    strModelFlags: [
        "IS_VAN",
        "IS_BUS",
        "IS_LOW",
        "IS_BIG",
        "ABS_STD",
        "ABS_OPTION",
        "ABS_ALT_STD",
        "ABS_ALT_OPTION",
        "NO_DOORS",
        "TANDEM_SEATS",
        "SIT_IN_BOAT",
        "HAS_TRACKS",
        "NO_EXHAUST",
        "DOUBLE_EXHAUST",
        "NO1FPS_LOOK_BEHIND",
        "CAN_ENTER_IF_NO_DOOR",
        "AXLE_F_TORSION",
        "AXLE_F_SOLID",
        "AXLE_F_MCPHERSON",
        "ATTACH_PED_TO_BODYSHELL",
        "AXLE_R_TORSION",
        "AXLE_R_SOLID",
        "AXLE_R_MCPHERSON",
        "DONT_FORCE_GRND_CLEARANCE",
        "DONT_RENDER_STEER",
        "NO_WHEEL_BURST",
        "INDESTRUCTIBLE",
        "DOUBLE_FRONT_WHEELS",
        "RC",
        "DOUBLE_RWHEELS",
        "MF_NO_WHEEL_BREAK",
        "IS_HATCHBACK"
    ],
    strHandlingFlags: [
        "SMOOTH_COMPRESN",
        "REDUCED_MOD_MASS",
        "(0x1 << 2)",
        "(0x1 << 3)",
        "NO_HANDBRAKE",
        "STEER_REARWHEELS",
        "HB_REARWHEEL_STEER",
        "STEER_ALL_WHEELS",
        "FREEWHEEL_NO_GAS",
        "NO_REVERSE",
        "(0x1 << 10)",
        "STEER_NO_WHEELS",
        "CVT",
        "ALT_EXT_WHEEL_BOUNDS_BEH",
        "DONT_RAISE_BOUNDS_AT_SPEED",
        "(0x1 << 15)",
        "LESS_SNOW_SINK",
        "TYRES_CAN_CLIP",
        "(0x1 << 18)",
        "(0x1 << 19)",
        "OFFROAD_ABILITY",
        "OFFROAD_ABILITY2",
        "HF_TYRES_RAISE_SIDE_IMPACT_THRESHOLD",
        "(0x1 << 23)",
        "ENABLE_LEAN",
        "(0x1 << 25)",
        "HEAVYARMOUR",
        "ARMOURED",
        "SELF_RIGHTING_IN_WATER",
        "IMPROVED_RIGHTING_FORCE",
        "(0x1 << 30)",
        "(0x1 << 31)"
    ],
    strDamageFlags: [
        "DRIVER_SIDE_FRONT_DOOR",
        "DRIVER_SIDE_REAR_DOOR",
        "DRIVER_PASSENGER_SIDE_FRONT_DOOR",
        "DRIVER_PASSENGER_SIDE_REAR_DOOR",
        "BONNET",
        "BOOT",
        "(0x1 << 6)",
        "(0x1 << 7)",
        "(0x1 << 8)",
        "(0x1 << 9)",
        "(0x1 << 10)",
        "(0x1 << 11)",
        "(0x1 << 12)",
        "(0x1 << 13)",
        "(0x1 << 14)",
        "(0x1 << 15)",
        "(0x1 << 16)",
        "(0x1 << 17)",
        "(0x1 << 18)",
        "(0x1 << 19)",
        "(0x1 << 20)",
        "(0x1 << 21)",
        "(0x1 << 22)",
        "(0x1 << 23)",
        "(0x1 << 24)",
        "(0x1 << 25)",
        "(0x1 << 26)",
        "(0x1 << 27)",
        "(0x1 << 28)",
        "(0x1 << 29)",
        "(0x1 << 30)",
        "(0x1 << 30)"
    ],
    strAdvancedFlags: [
        "(0x1 << 0)",
        "(0x1 << 1)",
        "(0x1 << 2)",
        "(0x1 << 3)",
        "(0x1 << 4)",
        "(0x1 << 5)",
        "(0x1 << 6)",
        "(0x1 << 7)",
        "(0x1 << 8)",
        "(0x1 << 9)",
        "(0x1 << 10)",
        "(0x1 << 11)",
        "(0x1 << 12)",
        "(0x1 << 13)",
        "(0x1 << 14)",
        "(0x1 << 15)",
        "Lower shifting points",
        "Over revving",
        "Bouncy suspension",
        "(0x1 << 19)",
        "(0x1 << 20)",
        "(0x1 << 21)",
        "(0x1 << 22)",
        "(0x1 << 23)",
        "(0x1 << 24)",
        "(0x1 << 25)",
        "(0x1 << 26)",
        "(0x1 << 27)",
        "(0x1 << 28)",
        "(0x1 << 29)",
        "(0x1 << 30)",
        "(0x1 << 30)"
    ]
};

function flagHexToStrArr(flagsHex, flagArr) {
    var ret = [];
    if (flagsHex == 0x0) return ["(none)"];
    if (flagArr === null) return ret;
    if (flagArr.length != 32) return ret;
    
    var flagsInt = parseInt(flagsHex, 16);

    for (var i=0x0; i<0x20; i++) {
        if (((0x1 << i) & flagsInt) !== 0x0) {
            ret.push(flagArr[i]);
        }
    }

    return ret;
}

function loadHandlingData(path, force = false) {
    if (Object.keys(handlingData).length > 0) {
        if (!force) return;
    }

    var folderContents = fs.readdirSync(path);
    folderContents.forEach(fileName => {
        if (!fileName.endsWith(".meta")) return;
        var fileContents = fs.readFileSync(path + "/" + fileName).toString();

        var tmpDlcNameBegin = fileName.indexOf("handling_");
        var tmpDlcNameEnd = fileName.indexOf(".meta");
        if (tmpDlcNameBegin === -1 || tmpDlcNameEnd === -1) throw Error("Invalid handling file: File not named correctly (" + fileName + ")");
        tmpDlcNameBegin += 9;
        var tmpDlcName = fileName.substring(tmpDlcNameBegin, tmpDlcNameEnd);
        if (tmpDlcName.length < 1) throw Error("Invalid handling file: File not named correctly (" + fileName + ")");

        // I know I could have just used a proper XML parser library, but whatever

        var itemBegin = 0;
        var itemEnd = 0;
        while ((itemBegin = fileContents.indexOf("<Item type=\"CHandlingData\">", itemEnd)) !== -1) {
            
            var subHandlingBegin = fileContents.indexOf("<SubHandlingData>", itemBegin + 27);
            var subHandlingEnd = -1;

            if (subHandlingBegin !== -1) {
                subHandlingEnd = fileContents.indexOf("</SubHandlingData>", subHandlingBegin + 17);
                if (subHandlingEnd === -1) throw new Error("Invalid handling file: End of 'SubHandlingData' not found");
                subHandlingEnd += 18;
            }

            // This is relying on the fact that the string "</Item>" (other than the one that closes CHandlingData) only appears inside of SubHandlingData (if any), and nowhere else!
            // I know it's jank af, but it works.

            itemEnd = fileContents.indexOf("</Item>", (subHandlingEnd === -1) ? itemBegin + 27 : subHandlingEnd);

            if (itemEnd === -1) throw new Error("Invalid handling file: End of 'Item' not found");

            itemEnd += 7;

            var handlingSingle = fileContents.substring(itemBegin, itemEnd); // Taking a copy of only the current vehicle's entry

            if (handlingSingle.length < 2000) throw new Error("Invalid handling file: Item too short"); // Just a sanity check. Even basic vehicles without SubHandlingData should be >2000 characters

            var vehicleNameBegin = handlingSingle.indexOf("<handlingName>");
            var vehicleNameEnd = handlingSingle.indexOf("</handlingName>");
            if (vehicleNameBegin === -1 || vehicleNameEnd === -1) throw new Error("Invalid handling file: Cannot find vehicle name");
            vehicleNameBegin += 14;

            var vehicleName = handlingSingle.substring(vehicleNameBegin, vehicleNameEnd).toLowerCase();

            dlcNames[vehicleName] = tmpDlcName;

            var handlingLines = handlingSingle.substr(vehicleNameEnd + 15).split("\n");

            var handlingTmp = {};

            handlingLines.map(handlingLine => {
                var lineForNameSearch = handlingLine.trim();
                handlingLine = handlingLine.replace(/\s/g, "");
                if (handlingLine.length === 0) return;
                if (handlingLine.startsWith("</")) return;
                if (!handlingLine.startsWith("<")) return;

                var propertyName = lineForNameSearch.substring(1, lineForNameSearch.substr(1).search(/\W/) + 1);

                if (propertyName === "SubHandlingData" || propertyName === "Item") return;

                if (propertyName.startsWith("vec")) {
                    var tmpVec = new Vec3();
                    ["x", "y", "z"].map(letter => {
                        var tmpBegin = handlingLine.indexOf(letter + "=\"");
                        if (tmpBegin === -1) throw new Error("Invalid handling file: Failed to extract Vec3 (" + propertyName + ")");
                        tmpBegin += 3;
                        var tmpEnd = handlingLine.indexOf("\"", tmpBegin);
                        if (tmpEnd === -1) throw new Error("Invalid handling file: Failed to extract Vec3 (" + propertyName + ")");
                        tmpVec[letter] = parseFloat(handlingLine.substring(tmpBegin, tmpEnd));
                    });
                    handlingTmp[propertyName] = tmpVec;
                    return;
                }

                var valueStr = "";

                var type1Begin = handlingLine.indexOf("value=\"");
                var type2End = handlingLine.indexOf("</");
                if (type1Begin !== -1) {
                    type1Begin += 7;
                    var type1End = handlingLine.indexOf("\"", type1Begin);
                    if (type1End === -1) throw new Error("Invalid handling file: Cannot find end of value (" + propertyName + ")");
                    valueStr = handlingLine.substring(type1Begin, type1End);
                } else if (type2End !== -1) {
                    var type2Begin = handlingLine.indexOf(">") + 1;
                    if (type2Begin >= type2End) throw new Error("Invalid handling file: Cannot parse type 2 format (" + propertyName + ")");
                    valueStr = handlingLine.substring(type2Begin, type2End);
                } else return;

                if (valueStr.length < 1) throw new Error("Invalid handling file: Empty value (" + propertyName + ")");

                if (propertyName.startsWith("f")) handlingTmp[propertyName] = parseFloat(valueStr);
                else if (propertyName.startsWith("n")) handlingTmp[propertyName] = parseInt(valueStr);
                else handlingTmp[propertyName] = valueStr;
            });

            handlingData[vehicleName] = handlingTmp;
        }
    });
}

module.exports = {
    loadFiles: function(path, force = false) {
        loadHandlingData(path, force);
    },

    getDlcNameForVehicle: function(vehicle) {
        if (!(is_string(vehicle)) || vehicle.length <= 0) return null;
        if (dlcNames.hasOwnProperty(vehicle)) return dlcNames[vehicle];
        else return null;
    },

    getCategoryOfProperty: function(propertyName) {
        if (!is_string(propertyName)) return propertyCategories.missing_property;
        if (propertyCategories.hasOwnProperty(propertyName)) return propertyCategories[propertyName];
        else return propertyCategories.missing_property;
    },

    convertFlagsPropertyToFlagNames: function (hex, propertyName) {
        if (!is_string(hex) || !is_string(propertyName)) return null;
        if (flagNames.hasOwnProperty(propertyName)) {
            return flagHexToStrArr(hex, flagNames[propertyName]);
        } else return null;
    },

    isPropertyConvertableToFlagNames: function (propertyName) {
        return flagNames.hasOwnProperty(propertyName);
    },

    doesVehicleExist: function(vehicle) {
        if (!(is_string(vehicle)) || vehicle.length <= 0) return false;
        return handlingData.hasOwnProperty(vehicle.toLowerCase());
    },

    getHandlingForVehicle: function (vehicle) {
        if (!(is_string(vehicle)) || vehicle.length <= 0) return null;
        vehicle = vehicle.toLowerCase();
        if (handlingData.hasOwnProperty(vehicle)) return handlingData[vehicle];
        else return null;
    },

    getSimpleHandlingForVehicle: function (vehicle) {
        if (!is_string(vehicle) || vehicle.length <= 0) return null;
        vehicle = vehicle.toLowerCase();
        if (handlingData.hasOwnProperty(vehicle)) {
            var ret = {};
            var vehicleHandling = handlingData[vehicle];
            simpleProperties.map(propertyName => {
                if (vehicleHandling.hasOwnProperty(propertyName)) ret[propertyName] = vehicleHandling[propertyName];
            });
            return ret;
        }
        else return null;
    },

    getPropertyForVehicle: function (vehicle, property) {
        if (!is_string(vehicle) || vehicle.length <= 0 || !is_string(property) || property.length <= 0) return null;
        vehicle = vehicle.toLowerCase();
        if (handlingData.hasOwnProperty(vehicle)) {
            var vehicleHandling = handlingData[vehicle];
            if (vehicleHandling.hasOwnProperty(property)) {
                var ret = {};
                ret[property] = vehicleHandling[property];
                return ret;
            }
            else return null;
        } else return null;
    },

    findPropertiesForVehicle: function (vehicle, propertySearch) {
        if (!is_string(vehicle) || vehicle.length <= 0 || !is_string(propertySearch) || propertySearch.length <= 0) return null;
        vehicle = vehicle.toLowerCase();
        propertySearch = propertySearch.toLowerCase();
        if (handlingData.hasOwnProperty(vehicle)) {
            var vehicleHandling = handlingData[vehicle];
            var properties = Object.keys(vehicleHandling);
            var ret = {};
            properties.map(propertyName => {
                if (propertyName.toLowerCase().includes(propertySearch)) {
                    ret[propertyName] = vehicleHandling[propertyName];
                } else {
                    if (propertyKeywords.hasOwnProperty(propertySearch)) {
                        if (propertyKeywords[propertySearch].findIndex(val => { return val == propertyName; }) != -1) {
                            ret[propertyName] = vehicleHandling[propertyName];
                        }
                    }
                }
            });
            if (Object.keys(ret).length == 0) return null;
            else return ret;
        } else return null;
    }
};
