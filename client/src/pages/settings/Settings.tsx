import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import BannerUtils from "./screens/BannerUtils.tsx";
import StatusUtils from "./screens/StatusUtils";
import CategoryUtils from "./screens/CategoryUtils";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function Settings() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="Banners" {...a11yProps(0)} />
          <Tab label="Status" {...a11yProps(1)} />
          <Tab label="Category" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <BannerUtils />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <StatusUtils />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <CategoryUtils />
      </CustomTabPanel>
    </Box>
  );
}

export default Settings;
