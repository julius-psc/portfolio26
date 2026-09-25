# Chrome is a room

This artifact is built around the simple question: What makes chrome look like chrome on a screen?

Chrome is not a silver tint texture; it's a mirror. The environment is what you *actually* see, through softboxes, horizon, dark floor. 

The card is the instrument. The room is the sound.

I chose this artifact as a Revolut user and found particular interest in their exclusive 'Chrome' edition debit card. I decided to use this as an excellent exercise to improve my design engineering skills.

However, the claim only holds if tilting the Revolut card results in the reflection moving faster than the card itself.

---

Now that you visualize chrome as a mirror, the shading model[^1] becomes embarrassingly small.

Instead of placing lights in the scene and computing how bright each pixel is, you ask yourself: if I look at this surface from here, which direction does the bounce go, and what colour is the room in that direction?

That bounce direction is given the name **R**, which is the reflection of the view off the normal. 

Softboxes only appear when R is pointing at them.

Roughness, brush, and the rainbow are just ways of changing where you are looking in the room, how blurry that look is, or what tint remains, but they're not a separate lighting pass.

---

As I mentioned, R depends on both which way the surface faces (**N**) and where you're looking from (**V**). 

When the card is rotated by a little angle **θ**, the reflection direction swings by about *twice* that, roughly **2θ**.
That doubling is why metal feels alive: the highlights race across the face faster than the card turns.

If the bright streak just follows the card, one-to-one, you're probably not sampling by R (but rather by UV or position instead).

In this artifact, the card has springy mass under the pointer, but the reflections should still outrun it.

That mismatch is the thesis made real.

---

A chrome shader in an empty room still looks like dull grey since the material *is* the environment. The studio has to exist for the card to even look like metal. 

In this artifact, I built a small dark studio into an environment map: horizon band, softboxes, dark floor, slight warm/cool split. 
A second pass blurs the map into mips[^2] so roughness can mean a blurrier view of the same room but not just a darker paint.

WebGPU is a good fit here because that prefilter can run once on the GPU at load.

The polished face sees that room in sharp focus while the etched lettering 'Revolut' and 'J. PESCHARD' sees the same room softer.

---

Roughness here isn't "how dark the metal is". It's how wide a cone of the room each pixel can gather, or which mip of the environment you read.

The face stays near-mirror (sharp studio) while the etched floors are rougher (out of focus studio). 
If you only darken the letters, they look printed. However, if you blur the room inside the cut, they look carved. 
The chip can be a third roughness (gold, a bit softer than the face).

Most importantly, it's the same environment map throughout; only the sharpness changes.

---

The rainbow is a thin coating on the steel (PVD), not a colour filter painted on the card. 

A colourless film that is a few hundred nanometres thick makes light bounce from the top of the film and from the metal underneath. Those two paths differ by about a wavelength, so some colours reinforce and others cancel out.

Tilt the card and the path length changes, so the surviving colours move.
In this artifact, the hues are authored on purpose to match Revolut's card, and interference/view is what *moves* them. 

Ordering matters here: put the iridescent result into **F0** (the metal's base reflectance) so Fresnel scales the environment sample. The colour only shows when there is reflection and blacks stay black.

Tint the final pixel instead and the dark areas go coloured too, but it reads as a filter over a render, not a coating on metal.

---

Chrome reads as metal when you show a room, not when you shade a surface. If it still looks "almost", check whether the reflections are outrunning the tilt.

[^1]: The algorithm used in computer graphics to compute how light interacts with a 3D surface to determine its final colour and brightness.

[^2]: A mip is a pre-blurred and tinier copy of a texture. Graphics cards store a chain of them (from sharp to soft) so that a surface can sample a blurrier version of the same image without having to blur it live every frame.