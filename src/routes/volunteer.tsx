import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import {
  getVolunteerProfile,
  getVolunteerService,
  setVolunteerAvailability,
  getActiveOrdersForVolunteer,
  acceptDeliveryOrder,
  updateDeliveryStatus,
} from '@/api/supabaseApi';
import type { VolunteerProfile, DeliveryService, ActiveDeliveryOrder } from '@/api/types';
import CapabilitySetupCard from '@/components/CapabilitySetupCard';
import AvailabilityToggle from '@/components/AvailabilityToggle';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Leaflet default icons fix
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function VolunteerPage() {
  const { session, profile: commonProfile } = useSession();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [service, setService] = useState<DeliveryService | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveDeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeAlert, setRealtimeAlert] = useState<string | null>(null);

  const loadData = async () => {
    if (!session?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const pRes = await getVolunteerProfile(session.userId);
      if (pRes.error) {
        setError(pRes.error.message);
        setLoading(false);
        return;
      }
      setProfile(pRes.data);

      if (pRes.data) {
        const sRes = await getVolunteerService(session.userId);
        if (!sRes.error) {
          setService(sRes.data);
        }
        await loadActiveOrders();
      }
    } catch {
      setError('Could not load volunteer information.');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveOrders = async () => {
    setLoadingOrders(true);
    try {
      const ordersRes = await getActiveOrdersForVolunteer(commonProfile?.city);
      if (ordersRes.data) {
        setActiveOrders(ordersRes.data);
      }
    } catch {
      // Graceful
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    void loadData();

    const handleMatchingUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ count?: number; totalMeals?: number }>;
      const meals = custom.detail?.totalMeals ?? 0;
      setRealtimeAlert(
        `⚡ Real-time Match Alert: The matching engine just paired ${meals > 0 ? meals + ' meals' : 'new orders'}! Your delivery queue has updated below.`,
      );
      void loadActiveOrders();
      if (session?.userId) {
        getVolunteerService(session.userId).then((sRes) => {
          if (!sRes.error) setService(sRes.data);
        });
      }
    };

    window.addEventListener('foodpulse:matching-updated', handleMatchingUpdated);
    return () => window.removeEventListener('foodpulse:matching-updated', handleMatchingUpdated);
  }, [session?.userId]);

  const handleAvailabilityChange = async (nextVal: boolean) => {
    if (!session?.userId) return;
    const res = await setVolunteerAvailability(session.userId, nextVal);
    if (res.error) {
      throw new Error(res.error.message);
    }
    setProfile(res.data);
  };

  const handleAcceptOrder = async (order: ActiveDeliveryOrder) => {
    if (!session?.userId || actionPending) return;
    setActionPending(true);
    try {
      const res = await acceptDeliveryOrder(session.userId, order);
      if (res.data) {
        setService(res.data);
        await loadActiveOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionPending(false);
    }
  };

  const handleAdvanceStatus = async (nextStatus: DeliveryService['status']) => {
    if (!service || actionPending) return;
    setActionPending(true);
    try {
      const res = await updateDeliveryStatus(service.id, nextStatus);
      if (res.data) {
        if (nextStatus === 'delivered' || nextStatus === 'cancelled') {
          setService(null);
          await loadActiveOrders();
        } else {
          setService(res.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionPending(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 text-foreground">
        <p className="text-sm text-muted-foreground">Loading volunteer portal…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 text-foreground space-y-4">
        <div className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
        <Button onClick={() => void loadData()} variant="outline">
          Retry
        </Button>
      </main>
    );
  }

  // Not a volunteer yet -> show first-use card per PRD §9.1
  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl p-4 sm:p-6 text-foreground space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Volunteer Network</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick up surplus meals and deliver them safely to community kitchens and shelters.
          </p>
        </div>
        <CapabilitySetupCard
          title="Want to work as a volunteer?"
          description="Use your time and vehicle to deliver food between donors and receivers in your community."
          yesLabel="Yes, set up volunteer profile"
          yesTo="/volunteer/onboarding"
          notNowLabel="Not now"
        />
      </main>
    );
  }

  const mapCenter: [number, number] = [
    commonProfile?.latitude || 19.076,
    commonProfile?.longitude || 72.8777,
  ];

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 text-foreground space-y-6">
      {/* Header with Volunteer Profile Details */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Volunteer Delivery Portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Volunteer: <span className="font-semibold text-foreground">{commonProfile?.fullName}</span> |{' '}
            City: <span className="font-medium text-foreground">{profile.operatingCity || commonProfile?.city || 'All areas'}</span> |{' '}
            Vehicle: <span className="font-medium text-foreground capitalize">{profile.vehicleType || 'Motorcycle'}</span> |{' '}
            Capacity: <span className="font-medium text-foreground">{profile.maxMealCapacity || 30} meals</span>
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/volunteer/onboarding">Edit Details</Link>
        </Button>
      </header>

      {/* Availability Status Section */}
      <section className="rounded-[var(--radius)] border border-border bg-card p-5 shadow-sm space-y-2">
        <AvailabilityToggle
          checked={profile.available}
          onChange={handleAvailabilityChange}
          label="Available for Delivery Assignments"
          description="When active, you are marked ready to accept new food pickups."
        />
      </section>

      {/* Active Service Delivery Lifecycle Section */}
      {service && (
        <section className="rounded-[var(--radius)] border-2 border-primary/40 bg-card p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Current Active Delivery Assignment
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-0.5 capitalize">
                Status: {service.status.replace('_', ' ')}
              </h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary w-fit capitalize">
              {service.status.replace('_', ' ')}
            </span>
          </div>

          {/* Delivery Lifecycle Step Bar */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs font-semibold">
            <div className={`p-2 rounded-[var(--radius)] ${service.status === 'accepted' ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground'}`}>
              1. Accepted
            </div>
            <div className={`p-2 rounded-[var(--radius)] ${service.status === 'picked_up' ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground'}`}>
              2. Picked Up
            </div>
            <div className={`p-2 rounded-[var(--radius)] ${service.status === 'in_transit' ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground'}`}>
              3. In Transit
            </div>
            <div className={`p-2 rounded-[var(--radius)] ${service.status === 'delivered' ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground'}`}>
              4. Delivered
            </div>
          </div>

          {/* Lifecycle Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
            {service.status === 'accepted' && (
              <Button
                onClick={() => void handleAdvanceStatus('picked_up')}
                disabled={actionPending}
                className="flex-1"
              >
                {actionPending ? 'Updating…' : '✓ Confirm Food Picked Up from Donor'}
              </Button>
            )}
            {service.status === 'picked_up' && (
              <Button
                onClick={() => void handleAdvanceStatus('in_transit')}
                disabled={actionPending}
                className="flex-1"
              >
                {actionPending ? 'Updating…' : '🚗 Start Transit to Receiver Location'}
              </Button>
            )}
            {service.status === 'in_transit' && (
              <Button
                onClick={() => void handleAdvanceStatus('delivered')}
                disabled={actionPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {actionPending ? 'Completing…' : '🎉 Mark Order as Successfully Delivered'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => void handleAdvanceStatus('cancelled')}
              disabled={actionPending}
            >
              Cancel Assignment
            </Button>
          </div>
        </section>
      )}

      {/* Real-time Match Alert Banner */}
      {realtimeAlert && (
        <aside aria-label="Real-time alert" className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-green-300 bg-green-50 p-4 text-sm text-green-900 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <p className="font-medium">{realtimeAlert}</p>
          </div>
          <button
            type="button"
            onClick={() => setRealtimeAlert(null)}
            className="text-xs text-green-700 hover:text-green-950 font-semibold uppercase shrink-0"
          >
            Dismiss
          </button>
        </aside>
      )}

      {/* Active Orders Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Active Orders in Network</h2>
            <p className="text-xs text-muted-foreground">
              Food donations and receiver requests ready for collection and delivery.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadActiveOrders()}
            disabled={loadingOrders}
          >
            {loadingOrders ? 'Refreshing…' : '↻ Refresh Orders'}
          </Button>
        </div>

        {/* Leaflet Map with all Active Order Pickup & Drop-off Pins */}
        {activeOrders.length > 0 && (
          <div className="rounded-[var(--radius)] border border-border overflow-hidden h-[300px]">
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {activeOrders.map((ord) => (
                <div key={ord.id}>
                  <Marker position={[ord.pickupLatitude, ord.pickupLongitude]} icon={pickupIcon}>
                    <Popup>
                      <div className="text-xs">
                        <strong>Pickup: {ord.foodDescription}</strong>
                        <p>{ord.pickupAddress}, {ord.pickupCity}</p>
                        <p className="text-green-700 font-bold">{ord.totalMeals} meals ({ord.vegMeals} Veg, {ord.nonVegMeals} Non-Veg)</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Marker position={[ord.receivingLatitude, ord.receivingLongitude]} icon={dropoffIcon}>
                    <Popup>
                      <div className="text-xs">
                        <strong>Drop-off Destination</strong>
                        <p>{ord.receivingAddress}, {ord.receivingCity}</p>
                      </div>
                    </Popup>
                  </Marker>
                </div>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Order Cards List */}
        {activeOrders.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center space-y-2">
            <p className="text-base font-semibold">No active orders needing pickup right now</p>
            <p className="text-sm text-muted-foreground">
              New donation pickups will appear here in real-time as donors post food.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeOrders.map((ord) => (
              <article
                key={ord.id}
                className="rounded-[var(--radius)] border border-border bg-card p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Ready for Collection
                    </span>
                    <h3 className="text-base font-bold text-foreground">
                      {ord.foodDescription}
                    </h3>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary w-fit">
                    {ord.totalMeals} Meals Total ({ord.vegMeals} Veg, {ord.nonVegMeals} Non-Veg)
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-3.5 rounded-[var(--radius)] border border-border">
                  <div>
                    <span className="text-xs font-bold text-green-700 uppercase flex items-center gap-1">
                      📍 Step 1: Donor Pickup Location
                    </span>
                    <p className="font-medium text-foreground mt-0.5">{ord.pickupAddress}</p>
                    <p className="text-xs text-muted-foreground">{ord.pickupCity}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pickup Window: until{' '}
                      {new Date(ord.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">
                      🏁 Step 2: Receiver Drop-off Destination
                    </span>
                    <p className="font-medium text-foreground mt-0.5">{ord.receivingAddress}</p>
                    <p className="text-xs text-muted-foreground">{ord.receivingCity}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Needed Before:{' '}
                      {new Date(ord.deliveryDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={() => void handleAcceptOrder(ord)}
                    disabled={actionPending || Boolean(service)}
                  >
                    {service ? 'Finish current delivery first' : 'Accept This Delivery Order →'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
