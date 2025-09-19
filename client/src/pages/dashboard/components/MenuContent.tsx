import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import { useNavigate } from 'react-router';

const mainListItems = [
  { text: 'Home', icon: <HomeRoundedIcon />,url:"/" },
  { text: 'Product Management', icon: <AnalyticsRoundedIcon />,url:"productManagment" },
  { text: 'Clients', icon: <PeopleRoundedIcon />,url:"clients" },
  { text: 'Orders', icon: <AssignmentRoundedIcon />,url:"orderManagement" },
];

const secondaryListItems = [
  { text: 'Settings', icon: <SettingsRoundedIcon />,link:"settings" },
  { text: 'About', icon: <InfoRoundedIcon />,link:"about" },
  { text: 'Feedback', icon: <HelpRoundedIcon />,link:"feedback" },
];

export default function MenuContent() {

  const navigate = useNavigate()
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }} onClick={()=>navigate(`/${item.url}`)} >
            <ListItemButton selected={index === 0}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }} onClick={()=>navigate(`/${item.link}`)}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}