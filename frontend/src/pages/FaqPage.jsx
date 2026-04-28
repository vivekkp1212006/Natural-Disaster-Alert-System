import React from "react";
import StaticInfoPage from "./StaticInfoPage";

const FaqPage = () => (
  <StaticInfoPage
    title="Frequently Asked Questions"
    sections={[
      { heading: "How are alerts generated?", text: "Alerts are generated from external disaster feeds and operation updates." },
      { heading: "How do I become a volunteer?", text: "Complete enrollment, request volunteer role, and finish required training modules." },
      { heading: "Why am I suspended?", text: "Suspensions are issued by camp officers or auto-applied after repeated warnings." },
    ]}
  />
);

export default FaqPage;
