# Cosmology Explorer

An interactive cosmology study companion by **Elisavet Pavlidi**.

**[Open the explorer](https://elisavetpavlidi.github.io/cosmology-explorer/)**

Explore how cosmic ingredients shape expansion, then follow a mode through inflationary Hubble exit and re-entry.

## Explore

- Adjustable present-day matter, radiation and dark-energy density parameters; curvature follows the closure relation.
- Hubble constant H₀ and constant dark-energy equation of state w.
- Linked scale factor, Hubble rate, comoving Hubble radius, component contributions and evolving density parameters Ωᵢ(a).
- Radiation, matter, de Sitter, Milne and illustrative flat ΛCDM presets.
- Epoch inspection, animation, fiducial overlays and CSV export.
- Constant-ε inflation with adjustable duration and comoving wavenumber, followed by radiation or matter domination.
- Cleanly rendered equations, assumptions and short study prompts.

## Run and check

A static website with no dependencies or build step. Serve this directory with any local HTTP server (ES modules require HTTP). For example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Run the numerical validation with:

```sh
node tests.mjs
```

The suite contains 119 checks against analytic radiation, matter, Milne, de Sitter and flat matter–Λ results, as well as integration consistency, branch handling, Hubble crossing and transition continuity.

## Physics and scope

FLRW in general relativity, with separately conserved radiation (including relativistic species), pressureless matter, constant-w dark energy and curvature derived from the present-day closure relation. The scale factor is normalized to a₀ = 1. The default parameters are illustrative, not a live cosmological fit.

Cosmic time is integrated in ln a using composite Simpson quadrature. Absolute age extends to a = 10⁻¹² plus an analytic asymptotic tail. Only the expanding branch connected to today is shown if E² becomes non-positive. Turning-point integrals are truncated at the sampled boundary and the interface states this limitation. The comoving Hubble radius is distinct from the particle horizon.

Inflation uses constant ε = −d ln H/dN and an instantaneous switch to radiation or matter with continuous H. Crossing compares the reduced comoving scale 1/k with 1/(aH), using c = 1. This is a background-dynamics demonstration, not a reheating calculation or perturbation-spectrum solver.

Reference: Daniel Baumann, *TASI Lectures on Inflation*, Lecture 1, [arXiv:0907.5424v2](https://arxiv.org/html/0907.5424v2).

Native MathML and SVG render all equations and plots. No external scripts, analytics, account sign-in or runtime service requests are needed.
