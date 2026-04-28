import React from "react";
import StaticInfoPage from "./StaticInfoPage";

const TermsPage = () => (
  <StaticInfoPage
    title="Terms and Conditions"
    sections={[
      { heading: "Platform usage", text: "Use the system responsibly and provide accurate profile details." },
      { heading: "Role compliance", text: "Role privileges are controlled and may be revoked for violations." },
    ]}
  />
);

export default TermsPage;
