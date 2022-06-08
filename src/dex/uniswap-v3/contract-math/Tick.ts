import { PoolState } from '../types';
import { LiquidityMath } from './LiquidityMath';
import { _require } from '../../../utils';

export class Tick {
  static update(
    state: PoolState,
    tick: bigint,
    tickCurrent: bigint,
    liquidityDelta: bigint,
    secondsPerLiquidityCumulativeX128: bigint,
    tickCumulative: bigint,
    time: bigint,
    upper: boolean,
    maxLiquidity: bigint,
  ): boolean {
    const info = state.ticks[Number(tick)];

    const liquidityGrossBefore = info.liquidityGross;
    const liquidityGrossAfter = LiquidityMath.addDelta(
      liquidityGrossBefore,
      liquidityDelta,
    );

    _require(
      liquidityGrossAfter <= maxLiquidity,
      'LO',
      { liquidityGrossAfter, maxLiquidity },
      'liquidityGrossAfter <= maxLiquidity',
    );

    const flipped = (liquidityGrossAfter == 0n) != (liquidityGrossBefore == 0n);

    if (liquidityGrossBefore == 0n) {
      if (tick <= tickCurrent) {
        info.secondsPerLiquidityOutsideX128 = secondsPerLiquidityCumulativeX128;
        info.tickCumulativeOutside = tickCumulative;
        info.secondsOutside = time;
      }
      info.initialized = true;
    }

    info.liquidityGross = liquidityGrossAfter;

    info.liquidityNet = upper
      ? info.liquidityNet - liquidityDelta
      : info.liquidityNet + liquidityDelta;
    return flipped;
  }

  static clear(state: PoolState, tick: bigint) {
    delete state.ticks[Number(tick)];
  }

  static cross(
    state: PoolState,
    tick: bigint,
    secondsPerLiquidityCumulativeX128: bigint,
    tickCumulative: bigint,
    time: bigint,
  ): bigint {
    const info = state.ticks[Number(tick)];
    info.secondsPerLiquidityOutsideX128 =
      secondsPerLiquidityCumulativeX128 - info.secondsPerLiquidityOutsideX128;
    info.tickCumulativeOutside = tickCumulative - info.tickCumulativeOutside;
    info.secondsOutside = time - info.secondsOutside;
    return info.liquidityNet;
  }
}
