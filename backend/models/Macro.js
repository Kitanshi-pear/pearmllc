module.exports = (sequelize, DataTypes) => {
    const Macro = sequelize.define("Macro", {
      click_id: DataTypes.INTEGER,
      source_id: DataTypes.INTEGER,
      subid1: DataTypes.STRING,
      subid2: DataTypes.STRING,
      subid3: DataTypes.STRING,
      subid4: DataTypes.STRING,
      subid5: DataTypes.STRING,
      // Add up to subid10 or more if needed
    });
  
    return Macro;
  };
  