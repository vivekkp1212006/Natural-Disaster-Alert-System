import React from "react";
import StaticInfoPage from "./StaticInfoPage";

const PrivacyPage = () => (
  <StaticInfoPage
    title="Privacy Policy"
    sections={[
      { heading: "Data collection", text: "We store account and location data only for emergency response and coordination." },
      { heading: "Data usage", text: "Data is used for alerts, camp assignment, and volunteer operations." },
    ]}
  />
);

export default PrivacyPage;
