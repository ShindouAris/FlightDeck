import { Map } from "@/components/ui/map/map";
import { Card } from "./ui/card";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const HAS_MAPBOX_TOKEN = Boolean(MAPBOX_ACCESS_TOKEN);

const FALLBACK_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

export function FocusFlight() {
  return (
    <Card className="w-full h-screen p-0 gap-0 overflow-hidden">

        <Map
            accessToken={MAPBOX_ACCESS_TOKEN}
            styles={HAS_MAPBOX_TOKEN ? undefined : FALLBACK_STYLES}
            center={[106.7009, 10.7769]}
            zoom={12} 
            showLoader={false}
        />
    </Card>

  );
}