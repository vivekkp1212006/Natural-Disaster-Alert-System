import React from "react";
import StaticInfoPage from "./StaticInfoPage";

const LegalPage = () => (
  <StaticInfoPage
    title="Legal Section"
    sections={[
      { heading: "Liability", text: "The platform supplements official systems and does not replace government advisories." },
      { heading: "Policy enforcement", text: "Disciplinary and suspension decisions are logged for audit and governance." },
    ]}
  />
);

export default LegalPage;
