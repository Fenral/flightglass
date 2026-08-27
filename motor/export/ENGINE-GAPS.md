# ENGINE GAPS — behavior at 410a365d47de5c7a1542edc71d0336cd5b7d1b56

## 1. RK4 start conditions

World axes are \(x=right, y=target, z=up\). Let
\(V=ballSpeed\cdot0.44704\), \(e=launchAngle\cdot\pi/180\), and
\(a=startDirection\cdot\pi/180\).

\[
v_0=[V\cos(e)\sin(a),\;V\cos(e)\cos(a),\;V\sin(e)]\quad\text{m/s}
\]

The centered D-plane unit axis is \(u_s=unit(v_{club}\times n_{face})\).
The public scalar `spinAxis` is derived from that vector as
\(-atan2(u_{s,z},hypot(u_{s,x},u_{s,y}))\cdot180/\pi\); it is not used to
reconstruct the vector. Therefore the five public scalars named in the
question are insufficient without `spinAxisUnit`. This is today's behavior.
The impact spin vector is

\[
\omega_0=u_s\cdot totalSpinRpm\cdot(2\pi/60)\quad\text{rad/s}.
\]

The RK4 state is \([x,y,z,v_x,v_y,v_z,|\omega|]\) initialized as
\([0,0,10^{-6},v_0,|\omega_0|]\). Its spin direction is held at
\(unit(\omega_0)\); only magnitude decays.

Sources: `flightglass-3d-spin-model.js:4-20`,
`flightglass-3d-spin-model.js:133-151`,
`flightglass-3d-spin-model.js:326-357`,
`flightglass-3d-spin-model.js:725-736`,
`impact-flight.js:300-316`.

## 2. `hasFlight`

\[
hasFlight=(carry>0)
\]

It is a local value and is not returned by `solveFlight`.

Source: `impact-flight.js:241-254`.

## 3. `inDomain`

`solveFlight` does not return `inDomain`. The Outcome adapter computes:

\[
inDomain=(signedVerticalSpinLoftDeg>0)
\]

No speed, Reynolds, spin-parameter, launch, carry, clamp or RK4 diagnostic enters this predicate.

Sources: `impact-outcome.js:14-25`, `impact-outcome.js:96-100`.

## 4. `reason`

`solveFlight` does not return `reason`. The Outcome adapter has exactly two values:

- `null` when \(signedVerticalSpinLoftDeg>0\);
- `"spin-loft"` when \(signedVerticalSpinLoftDeg\le0\).

Source: `impact-outcome.js:96-100`.

## 5. `signedBackspinRpm`

Let \(l\) be the unit launch direction and \(z=[0,0,1]\). The flight-relative
backspin axis is

\[
b=unit(l\times z),
\]

with fallback \([1,0,0]\). The signed projection is

\[
p=u_s\cdot b
\]

If \(|\,|p|-1\,|<10^{-14}\), the code returns
\(sign(p)\cdot totalSpinRpm\). Otherwise it returns
\(p\cdot totalSpinRpm\). The branch preserves an exact signed total when the
axes are numerically collinear.

Positive means the D-plane spin axis aligns with \(launchDirection\times up\);
negative means the opposite projection. Public `backspin` is
\(|signedBackspinRpm|\).

Sources: `flightglass-3d-spin-model.js:133-151`,
`flightglass-3d-spin-model.js:326-357`, `impact-flight.js:300-305`.

## 6. Curve when raw downrange is below 1 m

Let \(D_{raw}\) be raw RK4 down-launch-line metres and \(C_{raw}\) raw RK4 curve metres.

- If target carry is \(\le10^{-12}\), projection is defined, scale is \(1\), and the returned projected RK4 curve is \(C_{raw}\).
- Otherwise, if \(D_{raw}\ge1\), scale is \(targetCarryM/D_{raw}\) and projected RK4 curve is \(C_{raw}\cdot scale\).
- Otherwise, scale is `null`, projection is not defined, and the RK4 curve field remains \(C_{raw}\) unchanged.
- After that, public `curve` is forced to \(0\) when \(hasFlight=false\) or \(faceToPath=0\); otherwise it uses the projected-or-raw value above.

Sources: `impact-flight.js:129-177`, `impact-flight.js:317-321`.

## 7. Studio contact height

The Studio adapter creates

\[
x_{LP}=(10.5-ballPositionCm)/100,
\]
\[
z_{LP}=(arcHeightCm+z_{club})/100,
\]

where \(z_{club}=-0.2\) cm for iron and \(1.8\) cm for driver.
With \(R=1.2\), \(\phi=swingPlane\cdot\pi/180\),

\[
x_{eff}=x_{LP}-swingDirection\cdot R\cos(\phi)\cdot\pi/180,
\]
\[
\theta=\arcsin(clamp(-x_{eff}/R,-0.999,0.999)),
\]
\[
contactHeight=clubZ=z_{LP}+R(1-\cos\theta)\sin\phi.
\]

Sources: `impact-studio.html:416-452`,
`swing-parameters-and-impact.js:74-84`,
`swing-parameters-and-impact.js:164-171`.

## 8. Ground Entry / Exit

The current Studio surface computes a presentation crossing, not a consolidated engine field:

\[
c=1+z_{LP}/(R\sin\phi).
\]

If \(c\ge1\) or \(c\le-1\), both crossings are `null`. Otherwise
\(\theta_g=\arccos(c)\), Entry is \(P(-\theta_g)\), and Exit is \(P(+\theta_g)\).

For \(\psi=-swingDirection\cdot\pi/180\):

\[
u=(\cos\psi,\sin\psi,0),\quad
m=(-\sin\psi\cos\phi,\cos\psi\cos\phi,\sin\phi).
\]

Let \(\theta_i\) be impact theta,
\(d=R(1-\cos\theta_i)\cos\phi\), and

\[
LP=(x_{eff}\cos\psi+d\sin\psi,
x_{eff}\sin\psi-d\cos\psi,z_{LP}).
\]

Then

\[
P(\theta)=LP+R\sin\theta\,u+R(1-\cos\theta)\,m.
\]

Sources: `impact-studio.html:381-387`, `impact-studio.html:889-900`,
`swing-parameters-and-impact.js:66-125`.

## 9. Face-centre offset

Let \(r_b=0.0213\) m, \(lift=0\) for iron or \(0.030\) m for driver, and
\(sweet=0.0213\) m for iron or \(0.033\) m for driver.

\[
faceCentreOffsetMm=((lift+r_b)-(clubZ+sweet))\cdot1000.
\]

Positive means the ball meets the face above its centre; negative means below.
The JSON stores the raw float before the UI's integer display rounding.

Sources: `impact-studio.html:438-448`, `impact-studio.html:502-505`,
`impact-studio.html:521-522`.
