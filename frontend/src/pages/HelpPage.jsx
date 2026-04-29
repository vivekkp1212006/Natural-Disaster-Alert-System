import React from "react";
import StaticInfoPage from "./StaticInfoPage";

const HelpPage = () => (
  <StaticInfoPage
    title="Help"
    sections={[
      { heading: "Need support?", text: "For technical support contact teamaegis2026@gmail.com." },
      { heading: "Account issues", text: "If your account is locked or suspended, contact your camp officer/admin." },
    ]}
  />
);

export default HelpPage;
