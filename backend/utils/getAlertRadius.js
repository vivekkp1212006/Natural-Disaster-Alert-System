const getAlertRadius = (magnitude) => {
  if (magnitude < 4.0) 
  {
    return null;
  } 
  else if (magnitude < 5.0) 
  {
    return 100;
  } 
  else if (magnitude < 6.0) 
  {
    return 150;
  } 
  else if (magnitude < 7.0) 
  {
    return 300;
  } 
  else if (magnitude < 8.0) 
  {
    return 500;
  } 
  else 
  {
    return 800;
  }
};

module.exports = getAlertRadius;