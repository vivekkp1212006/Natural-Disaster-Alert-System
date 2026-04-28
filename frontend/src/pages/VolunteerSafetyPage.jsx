import React from "react";
import StaticInfoPage from "./StaticInfoPage";

const VolunteerSafetyPage = () => (
  <StaticInfoPage
    title="Volunteer Safety"
    sections={[
      { heading: "Field safety", text: "Always follow camp officer instructions and verified operation plans." },
      { heading: "Health and readiness", text: "Use proper safety gear and report unsafe environments immediately." },
    ]}
  />
);

export default VolunteerSafetyPage;
